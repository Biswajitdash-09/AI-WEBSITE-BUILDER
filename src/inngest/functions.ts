import { openai, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { inngest } from "./client";
import { PROMPT, RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

// --- Constants ---
const SANDBOX_TIMEOUT_MS = 600_000; // 10 minutes — reduces credit consumption
const SANDBOX_REQUEST_TIMEOUT_MS = 60_000; // 60s for API requests
const NPM_INSTALL_TIMEOUT_MS = 60_000; // 60s for npm installs
const MAX_AGENT_ITERATIONS = 15;
const MAX_CONVERSATION_HISTORY = 20; // Max messages to include in context

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

const llmClient = new OpenAI();

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // ─── Step 1: Fetch previous messages for conversation context ───
    const previousMessages = await step.run("get-previous-messages", async () => {
      try {
        const messages = await prisma.message.findMany({
          where: { projectId: event.data.projectId },
          orderBy: { createdAt: "asc" },
          include: { fragment: true },
        });

        return messages.map((msg) => ({
          role: msg.role.toLowerCase() as "user" | "assistant",
          content: msg.content,
          fragmentTitle: msg.fragment?.title ?? null,
          fragmentFiles: msg.fragment?.files as Record<string, string> | null,
        }));
      } catch (e) {
        console.error("Failed to fetch previous messages:", e);
        return [];
      }
    });

    // Accumulate ALL files across all fragments (layered chronologically)
    const allPreviousFiles: Record<string, string> = {};
    for (const msg of previousMessages) {
      if (msg.role === "assistant" && msg.fragmentFiles) {
        Object.assign(allPreviousFiles, msg.fragmentFiles);
      }
    }
    const hasPreviousFiles = Object.keys(allPreviousFiles).length > 0;

    // ─── Step 2: Create sandbox with 10-minute expiration ───
    const sandboxId = await step.run("get-sandbox-id", async () => {
      try {
        console.log("Creating sandbox...");
        const sandbox = await Sandbox.create(
          process.env.E2B_TEMPLATE_ID || "vibe-nextjs-biswajit-123",
          {
            timeoutMs: SANDBOX_TIMEOUT_MS,
            requestTimeoutMs: SANDBOX_REQUEST_TIMEOUT_MS,
            apiKey: process.env.E2B_API_KEY, // Private template support
          }
        );
        console.log("Sandbox created:", sandbox.sandboxId);
        return sandbox.sandboxId;
      } catch (e) {
        console.error("Sandbox creation failed:", e);
        throw new Error(
          `Failed to create sandbox: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    });

    // ─── Step 3: Seed sandbox with previous files (follow-up) ───
    if (hasPreviousFiles) {
      await step.run("seed-sandbox-with-previous-files", async () => {
        const sandbox = await getSandbox(sandboxId);
        let seeded = 0;
        let failed = 0;

        for (const [filePath, content] of Object.entries(allPreviousFiles)) {
          try {
            await sandbox.files.write(filePath, content);
            seeded++;
          } catch (e) {
            failed++;
            console.error(`Failed to seed ${filePath}:`, e);
          }
        }

        console.log(
          `Seeded ${seeded} files, ${failed} failed from previous fragments`
        );

        // Reinstall dependencies after seeding
        try {
          await sandbox.commands.run("cd /home/user && npm install --yes", {
            timeoutMs: NPM_INSTALL_TIMEOUT_MS,
          });
          console.log("npm install completed after seeding");
        } catch (e) {
          console.error("npm install after seeding failed (non-fatal):", e);
        }
      });
    }

    // ─── Step 4: Get sandbox URL ───
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      try {
        const sandbox = await getSandbox(sandboxId);
        const host = sandbox.getHost(3000);
        const url = `https://${host}`;
        console.log("Sandbox URL:", url);
        return url;
      } catch (e) {
        console.error("Failed to get sandbox URL:", e);
        throw new Error(
          `Failed to get sandbox URL: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    });

    // Initialize file tracker with previous files
    const initialFiles = hasPreviousFiles ? { ...allPreviousFiles } : {};

    // ─── Step 5: Define the code agent ───
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
                  timeoutMs: NPM_INSTALL_TIMEOUT_MS,
                });
                return result.stdout || "(no output)";
              } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                console.error(
                  `Command failed: ${errorMsg}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
                );
                return `Command failed: ${errorMsg}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
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
          handler: async (
            { files },
            { network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles =
                  network?.state?.data?.files || { ...initialFiles };
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                console.error("createOrUpdateFiles failed:", errorMsg);
                return `Error: ${errorMsg}`;
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
                  try {
                    const content = await sandbox.files.read(file);
                    contents.push({ path: file, content });
                  } catch (fileErr) {
                    contents.push({
                      path: file,
                      content: `Error reading file: ${fileErr instanceof Error ? fileErr.message : String(fileErr)}`,
                    });
                  }
                }
                return JSON.stringify(contents);
              } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                return `Error: ${errorMsg}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantTextMessageText && network) {
            if (lastAssistantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessageText;
            }
          }
          return result;
        },
      },
    });

    // ─── Step 6: Create and run the agent network ───
    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: MAX_AGENT_ITERATIONS,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    // Build enhanced prompt with conversation history
    let agentInput = event.data.value;

    if (previousMessages.length > 0) {
      // Limit to recent messages to avoid token overflow
      const recentMessages = previousMessages.slice(-MAX_CONVERSATION_HISTORY);

      const contextBlock = recentMessages
        .map((msg) => {
          const prefix = `[${msg.role.toUpperCase()}]`;
          if (msg.role === "assistant" && msg.fragmentTitle) {
            return `${prefix} (Built: "${msg.fragmentTitle}"): ${msg.content}`;
          }
          return `${prefix}: ${msg.content}`;
        })
        .join("\n");

      const fileList = Object.keys(allPreviousFiles).join(", ");

      agentInput = [
        `Here is the conversation history so far:\n\n${contextBlock}`,
        `---`,
        `The user's latest request:\n${event.data.value}`,
        ``,
        `IMPORTANT: This is a follow-up message in an existing project.`,
        `The sandbox already contains the following files from previous work: ${fileList}`,
        ``,
        `You MUST:`,
        `1. First use readFiles to read the existing files to understand the current state`,
        `2. Then modify or enhance the existing code based on the user's request`,
        `3. Use createOrUpdateFiles to write ALL modified files`,
        `4. Do NOT start from scratch — build upon the existing code`,
        `5. Preserve all existing functionality unless the user asks to remove something`,
      ].join("\n");
    }

    let result;
    try {
      result = await network.run(agentInput);
    } catch (e) {
      console.error("Agent execution failed:", e);

      // Save a user-friendly error message instead of crashing
      await step.run("save-agent-error", async () => {
        await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content:
              "Sorry, something went wrong while building your project. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      });

      return { url: sandboxUrl, error: true };
    }

    // Merge previous files with files from this run
    const mergedFiles = {
      ...allPreviousFiles,
      ...(result.state.data.files || {}),
    };

    const isError =
      !result.state.data.summary ||
      Object.keys(mergedFiles).length === 0;

    // ─── Step 7: Generate title and response ───
    const [fragmentTitle, responseMessage] = await step.run(
      "generate-title-and-response",
      async () => {
        if (isError) {
          return [
            "Fragment",
            "Something went wrong while building. Please try again.",
          ] as const;
        }

        const summary = result.state.data.summary;

        try {
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
            responseResult.choices[0]?.message?.content?.trim() || summary;

          return [title, response] as const;
        } catch (e) {
          console.error("Title/response generation failed:", e);
          return ["Fragment", summary] as const;
        }
      }
    );

    // ─── Step 8: Save result ───
    await step.run("save-result", async () => {
      try {
        if (isError) {
          return await prisma.message.create({
            data: {
              projectId: event.data.projectId,
              content:
                "Something went wrong while building. Please try again.",
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
                files: mergedFiles,
              },
            },
          },
        });
      } catch (e) {
        console.error("Failed to save result:", e);
        // Last-resort error message
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Your project was built but we couldn't save the result. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
    });

    return {
      url: sandboxUrl,
      title: fragmentTitle,
      files: mergedFiles,
      summary: result.state.data.summary,
    };
  }
);