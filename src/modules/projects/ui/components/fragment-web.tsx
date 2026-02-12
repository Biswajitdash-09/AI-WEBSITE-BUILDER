"use client";

import { useState } from "react";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";

import { Fragment } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";

interface Props {
    data: Fragment;
};

export function FragmentWeb({ data }: Props) {
    const [fragmentKey, setFragmentKey] = useState(0);

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between border-b px-4 h-12 shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate">
                        {data.sandboxUrl}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setFragmentKey((prev) => prev + 1)}
                    >
                        <RefreshCcwIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                            window.open(data.sandboxUrl, "_blank");
                        }}
                    >
                        <ExternalLinkIcon />
                    </Button>
                </div>
            </div>
            <iframe
                key={fragmentKey}
                className="h-full w-full"
                sandbox="allow-forms allow-scripts allow-same-origin"
                loading="lazy"
                src={data.sandboxUrl}
            />
        </div>
    );
};
