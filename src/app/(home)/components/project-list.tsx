"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

export function ProjectList() {
    const trpc = useTRPC();

    const { data: projects } = useSuspenseQuery(
        trpc.projects.getMany.queryOptions()
    );

    if (projects.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Saved Vibes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="group flex items-center gap-3 rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                    >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate group-hover:underline">
                                {project.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(project.updatedAt), {
                                    addSuffix: true,
                                })}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
