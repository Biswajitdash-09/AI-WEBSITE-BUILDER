"use client";

import { ChevronRightIcon } from "lucide-react";

interface Props {
    filePath: string;
}

export function FilepathBreadcrumbs({ filePath }: Props) {
    const segments = filePath.split("/");

    return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground px-4 py-2 overflow-x-auto">
            {segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-1 shrink-0">
                    {index > 0 && (
                        <ChevronRightIcon className="h-3 w-3 text-muted-foreground/50" />
                    )}
                    <span
                        className={
                            index === segments.length - 1
                                ? "text-foreground font-medium"
                                : ""
                        }
                    >
                        {segment}
                    </span>
                </div>
            ))}
        </div>
    );
}
