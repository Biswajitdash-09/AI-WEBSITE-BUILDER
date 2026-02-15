import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";

export const FREE_CREDITS = 5;
export const PRO_CREDITS = 100;

export async function getIsPro() {
    const { has, sessionClaims } = await auth();

    // Use Clerk's has() to check for active subscription plan
    // The plan slug must match what's configured in Clerk Dashboard
    const hasPro = has?.({ plan: "pro" });

    if (hasPro) return true;

    // Fallback: check session claims for plan metadata
    const claims = sessionClaims as Record<string, unknown> | null;
    if (claims?.plan === "pro") return true;

    return false;
}

export async function consumeCredits(userId: string) {
    const isPro = await getIsPro();
    const limit = isPro ? PRO_CREDITS : FREE_CREDITS;
    const key = userId;

    // Get or create usage record
    let usage = await prisma.usage.findUnique({
        where: { key },
    });

    const now = new Date();

    if (!usage || (usage.expire && usage.expire < now)) {
        // Create or reset usage - set expiry 30 days from now
        const expire = new Date();
        expire.setDate(expire.getDate() + 30);

        usage = await prisma.usage.upsert({
            where: { key },
            update: {
                points: 1,
                expire,
            },
            create: {
                key,
                points: 1,
                expire,
            },
        });

        return {
            used: 1,
            limit,
            remaining: limit - 1,
            expire,
        };
    }

    // Check if limit is reached
    if (usage.points >= limit) {
        throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `You have used all ${limit} credits. ${isPro
                ? "Please wait for your credits to reset."
                : "Upgrade to Pro for more credits."
                }`,
        });
    }

    // Increment usage
    const updated = await prisma.usage.update({
        where: { key },
        data: {
            points: { increment: 1 },
        },
    });

    return {
        used: updated.points,
        limit,
        remaining: limit - updated.points,
        expire: updated.expire,
    };
}

export async function getUsageStatus(userId: string) {
    const isPro = await getIsPro();
    const limit = isPro ? PRO_CREDITS : FREE_CREDITS;
    const key = userId;

    const usage = await prisma.usage.findUnique({
        where: { key },
    });

    const now = new Date();

    if (!usage || (usage.expire && usage.expire < now)) {
        return {
            used: 0,
            limit,
            remaining: limit,
            expire: null,
            isPro,
        };
    }

    return {
        used: usage.points,
        limit,
        remaining: Math.max(0, limit - usage.points),
        expire: usage.expire,
        isPro,
    };
}
