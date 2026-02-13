"use client";

import { useMemo, useState } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";

import { Fragment } from "@/generated/prisma/client";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "@/components/tree-view";
import { FilepathBreadcrumbs } from "./filepath-breadcrumbs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Props {
    data: Fragment;
}

export function FragmentCode({ data }: Props) {
    const [copied, setCopied] = useState(false);

    const files = useMemo(() => {
        if (!data.files || typeof data.files !== "object") return {};
        return data.files as Record<string, string>;
    }, [data.files]);

    const fileKeys = Object.keys(files);
    const [selectedFile, setSelectedFile] = useState<string | null>(
        fileKeys.length > 0 ? fileKeys[0] : null
    );

    const treeItems = useMemo(() => convertFilesToTreeItems(files), [files]);

    const selectedFileContent = selectedFile ? files[selectedFile] ?? "" : "";

    const handleCopy = async () => {
        if (!selectedFileContent) return;
        await navigator.clipboard.writeText(selectedFileContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex h-full w-full">
            {/* File Explorer Sidebar */}
            <div className="w-60 shrink-0 border-r overflow-hidden flex flex-col">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b shrink-0">
                    Files
                </div>
                <ScrollArea className="flex-1">
                    <div className="py-1">
                        <TreeView
                            data={treeItems}
                            selectedFile={selectedFile}
                            onSelectFile={setSelectedFile}
                        />
                    </div>
                </ScrollArea>
            </div>

            {/* Code View */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {selectedFile ? (
                    <>
                        <div className="flex items-center justify-between border-b shrink-0">
                            <FilepathBreadcrumbs filePath={selectedFile} />
                            <div className="pr-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <CopyIcon className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 relative">
                            <pre className="p-4 text-sm font-mono leading-relaxed">
                                <code>{selectedFileContent}</code>
                            </pre>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        Select a file to view its contents
                    </div>
                )}
            </div>
        </div>
    );
}
