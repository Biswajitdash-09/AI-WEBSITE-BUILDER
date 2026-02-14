import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
    getMany: protectedProcedure
        .query(async ({ ctx }) => {
            const projects = await prisma.project.findMany({
                where: {
                    userId: ctx.clerkUserId,
                },
                orderBy: {
                    updatedAt: "desc",
                },
            });
            return projects;
        }),
    getOne: protectedProcedure
        .input(z.object({
            id: z.string().min(1, { message: "Id is required" }),
        }))
        .query(async ({ ctx, input }) => {
            const project = await prisma.project.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.clerkUserId,
                },

            });

            if (!project) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
            }

            return project;
        }),
    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                    .min(1, { message: "Value is required" })
                    .max(10000, { message: "Value is too long" })
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const createdProject = await prisma.project.create({
                data: {
                    userId: ctx.clerkUserId,
                    name: generateSlug(2, {
                        format: "kebab",
                    }),
                    messages: {
                        create: {
                            content: input.value,
                            role: "USER",
                            type: "RESULT",
                        }

                    }
                }
            });



            await inngest.send({
                name: "code-agent/run",
                data: {
                    value: input.value,
                    projectId: createdProject.id,
                },
            });

            return createdProject;
        }),
    update: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, { message: "Id is required" }),
                name: z.string().min(1, { message: "Name is required" }).max(50, { message: "Name is too long" }),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const project = await prisma.project.update({
                where: {
                    id: input.id,
                    userId: ctx.clerkUserId,
                },
                data: {
                    name: input.name,
                },
            });

            if (!project) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
            }

            return project;
        }),
});