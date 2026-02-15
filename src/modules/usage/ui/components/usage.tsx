"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ZapIcon, ClockIcon } from "lucide-react";

import { useTRPC } from "@/trpc/client";

export function Usage() {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.usage.getStatus.queryOptions());

    const percentage = data.limit > 0 ? (data.used / data.limit) * 100 : 0;
    const isLow = data.remaining <= 1;
    const isExhausted = data.remaining <= 0;

    // Format reset time
    const resetText = data.expire
        ? (() => {
            const now = new Date();
            const expire = new Date(data.expire);
            const diffMs = expire.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) return "Resets soon";
            if (diffDays === 1) return "Resets tomorrow";
            return `Resets in ${diffDays} days`;
        })()
        : null;

    return (
        <div
            className={`flex items-center justify-between gap-4 rounded-t-xl border border-b-0 px-4 py-2 text-xs ${isExhausted
                    ? "bg-destructive/10 border-destructive/30"
                    : isLow
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-sidebar border-border"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <ZapIcon
                        className={`h-3.5 w-3.5 ${isExhausted
                                ? "text-destructive"
                                : isLow
                                    ? "text-yellow-500"
                                    : "text-primary"
                            }`}
                    />
                    <span className="font-medium">
                        {data.remaining}/{data.limit} credits
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isExhausted
                                ? "bg-destructive"
                                : isLow
                                    ? "bg-yellow-500"
                                    : "bg-primary"
                            }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                </div>

                {resetText && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <ClockIcon className="h-3 w-3" />
                        <span>{resetText}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
