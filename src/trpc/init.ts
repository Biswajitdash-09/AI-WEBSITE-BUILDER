import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from "superjson";
import { auth } from "@clerk/nextjs/server";

export const createTRPCContext = cache(async () => {
  const { userId } = await auth();

  return { clerkUserId: userId };
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      clerkUserId: ctx.clerkUserId,
    },
  });
});