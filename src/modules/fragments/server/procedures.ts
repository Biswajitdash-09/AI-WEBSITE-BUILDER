import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { prisma } from "@/lib/db";

export const fragmentsRouter = createTRPCRouter({
    updateFile: protectedProcedure
        .input(
            z.object({
                fragmentId: z.string(),
                sandboxId: z.string(),
                filePath: z.string(),
                content: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            const { fragmentId, sandboxId, filePath, content } = input;

            try {
                // 1. Write to Sandbox (for live preview)
                const sandbox = await Sandbox.connect(sandboxId);
                await sandbox.files.write(filePath, content);

                // 2. Persist to Database (for reload/history)
                const fragment = await prisma.fragment.findUnique({
                    where: { id: fragmentId },
                });

                if (fragment) {
                    const currentFiles = (fragment.files as Record<string, string>) || {};
                    const newFiles = { ...currentFiles, [filePath]: content };

                    await prisma.fragment.update({
                        where: { id: fragmentId },
                        data: {
                            files: newFiles,
                        },
                    });
                }

                return { success: true };
            } catch (e) {
                console.error("Failed to write file:", e);
                const message =
                    e instanceof Error ? e.message : "Unknown error";

                // If sandbox expired, return a clear error
                if (
                    message.includes("not found") ||
                    message.includes("expired")
                ) {
                    return {
                        success: false,
                        error: "Sandbox has expired. Please regenerate the project.",
                    };
                }

                return { success: false, error: `Failed to save: ${message}` };
            }
        }),
});
