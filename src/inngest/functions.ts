import { openai, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { inngest } from "./client";
import { PROMPT, RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";
import OpenAI from "openai";


interface AgentState {
  summary: string;
  files: { [path: string]: string };
};

const llmClient = new OpenAI();

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // Step 1: Fetch previous messages for context
    const previousMessages = await step.run("get-previous-messages", async () => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          fragment: true,
        },
      });

      return messages.map((msg) => ({
        role: msg.role.toLowerCase() as "user" | "assistant",
        content: msg.content,
        fragmentFiles: msg.fragment?.files as Record<string, string> | null,
      }));
    });

    // Accumulate ALL files across all fragments (layered in order)
    // This ensures we have the complete file set, not just the last fragment
    const allPreviousFiles: Record<string, string> = {};
    for (const msg of previousMessages) {
      if (msg.role === "assistant" && msg.fragmentFiles) {
        Object.assign(allPreviousFiles, msg.fragmentFiles);
      }
    }
    const hasPreviousFiles = Object.keys(allPreviousFiles).length > 0;

    const sandboxId = await step.run("get-sandbox-id", async () => {
      console.log("Creating sandbox...");
      const sandbox = await Sandbox.create("vibe-nextjs-biswajit-123", {
        timeoutMs: 300000, // 5 minutes sandbox lifetime
        requestTimeoutMs: 60000, // 60 seconds for API request
      });
      console.log("Sandbox created:", sandbox.sandboxId);
      return sandbox.sandboxId
    });

    // Seed the sandbox with ALL previous fragment files (if follow-up)
    if (hasPreviousFiles) {
      await step.run("seed-sandbox-with-previous-files", async () => {
        const sandbox = await getSandbox(sandboxId);

        // Write all accumulated files to the new sandbox
        for (const [filePath, content] of Object.entries(allPreviousFiles)) {
          try {
            await sandbox.files.write(filePath, content);
            console.log(`Seeded: ${filePath}`);
          } catch (e) {
            console.error(`Failed to seed ${filePath}:`, e);
          }
        }

        console.log(
          `Seeded ${Object.keys(allPreviousFiles).length} files from previous fragments`
        );

        // Check if any previous files import packages that need to be installed
        // by detecting package.json changes or npm install needs
        try {
          // Run npm install to ensure any dependencies are resolved
          await sandbox.commands.run("cd /home/user && npm install --yes", {
            timeoutMs: 30000,
          });
          console.log("npm install completed after seeding");
        } catch (e) {
          console.error("npm install after seeding failed:", e);
        }
      });
    }

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      const url = `https://${host}`;
      console.log("Sandbox URL:", url);
      return url;
    })


    // Initialize the file tracker with previous files so the saved fragment
    // will contain ALL files, not just the ones modified in this run
    const initialFiles = hasPreviousFiles ? { ...allPreviousFiles } : {};

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4o",
        defaultParameters: {
          temperature: 0.1,
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }) => {
            return await step.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`,
                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files },
            { network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step.run("createOrUpdateFiles", async () => {
              try {
                // Start with existing tracked files (includes previous fragment files)
                const updatedFiles = network?.state?.data?.files || { ...initialFiles };
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (e) {
                return "Error: " + e;
              }
            });

            if (newFiles && typeof newFiles === "object") {
              if (network?.state?.data) {
                network.state.data.files = newFiles;
              }
            }

          },
        }),
        createTool({
          name: "readFiles",
          description: "read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }) => {
            return await step.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            })
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessageText = lastAssistantTextMessageContent(result);

          if (lastAssistantTextMessageText && network) {
            if (lastAssistantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }
        return codeAgent;
      }
    });

    // Build the prompt with previous messages context
    let agentInput = event.data.value;

    if (previousMessages.length > 0) {
      const contextBlock = previousMessages
        .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
        .join("\n");

      const fileList = Object.keys(allPreviousFiles).join(", ");

      agentInput = `Here is the conversation history so far:\n\n${contextBlock}\n\n---\n\nThe user's latest request:\n${event.data.value}\n\nIMPORTANT: This is a follow-up message in an existing project. The sandbox already contains the following files from previous work: ${fileList}\n\nYou MUST:\n1. First use readFiles to read the existing files (use paths like "/home/user/app/page.tsx") to understand the current state\n2. Then modify or enhance the existing code based on the user's request\n3. Use createOrUpdateFiles to write ALL modified files\n4. Do NOT start from scratch — build upon the existing code\n5. Preserve all existing functionality unless the user asks to remove something`;
    }


    let result;
    try {
      result = await network.run(agentInput);
    } catch (e) {
      console.error("Agent execution failed:", e);
      throw e;
    }

    // Merge previous files with files from this run
    // This ensures the fragment has the COMPLETE set of files
    const mergedFiles = {
      ...allPreviousFiles,
      ...(result.state.data.files || {}),
    };

    const isError =
      !result.state.data.summary ||
      Object.keys(mergedFiles).length === 0;

    // Generate fragment title and response message in parallel
    const [fragmentTitle, responseMessage] = await step.run(
      "generate-title-and-response",
      async () => {
        if (isError) {
          return ["Fragment", "Something went wrong. Please try again."] as const;
        }

        const summary = result.state.data.summary;

        const [titleResult, responseResult] = await Promise.all([
          llmClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: FRAGMENT_TITLE_PROMPT },
              { role: "user", content: summary },
            ],
            temperature: 0.3,
            max_tokens: 20,
          }),
          llmClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: RESPONSE_PROMPT },
              { role: "user", content: summary },
            ],
            temperature: 0.7,
            max_tokens: 150,
          }),
        ]);

        const title =
          titleResult.choices[0]?.message?.content?.trim() || "Fragment";
        const response =
          responseResult.choices[0]?.message?.content?.trim() ||
          summary;

        return [title, response] as const;
      }
    );

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: responseMessage,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: fragmentTitle,
              // Save the MERGED files (previous + current)
              files: mergedFiles,
            }
          },
        },
      })
    });

    return {
      url: sandboxUrl,
      title: fragmentTitle,
      files: mergedFiles,
      summary: result.state.data.summary,
    };
  },
);