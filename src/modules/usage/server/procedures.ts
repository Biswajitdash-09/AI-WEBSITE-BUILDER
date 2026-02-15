import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { getUsageStatus } from "@/lib/credits";

export const usageRouter = createTRPCRouter({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
        return getUsageStatus(ctx.clerkUserId);
    }),
});
