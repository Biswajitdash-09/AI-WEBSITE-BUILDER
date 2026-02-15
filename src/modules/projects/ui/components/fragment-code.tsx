"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { CopyIcon, CheckIcon, SaveIcon, Loader2Icon } from "lucide-react";

import { Fragment } from "@/generated/prisma/client";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "@/components/tree-view";
import { FilepathBreadcrumbs } from "./filepath-breadcrumbs";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
    data: Fragment;
    onPreviewRefresh?: () => void;
}

/**
 * Extract sandbox ID from sandbox URL.
 * Supports both formats:
 * - https://{sandboxId}-{port}.e2b.dev
 * - https://{port}-{sandboxId}.e2b.dev
 */
function extractSandboxId(sandboxUrl: string): string | null {
    try {
        const url = new URL(sandboxUrl);
        const host = url.hostname; // e.g. "abc123-3000.e2b.dev" or "3000-abc123.e2b.dev"

        // Remove .e2b.dev or .e2b.app suffix
        const base = host.replace(/\.e2b\.(dev|app)$/, "");

        // Try to match PORT-ID format (e.g. 3000-abc-123)
        const portPrefixMatch = base.match(/^\d+-(.+)$/);
        if (portPrefixMatch) {
            return portPrefixMatch[1];
        }

        // Try to match ID-PORT format (e.g. abc-123-3000)
        const portSuffixMatch = base.match(/^(.+)-\d+$/);
        if (portSuffixMatch) {
            return portSuffixMatch[1];
        }

        // If no port pattern found, but we stripped the suffix, assume the base is the ID
        // (e.g. https://my-sandbox-id.e2b.app)
        if (base !== host) {
            return base;
        }

        return null;
    } catch {
        return null;
    }
}

export function FragmentCode({ data, onPreviewRefresh }: Props) {
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

    // Editable content state
    const originalContent = selectedFile ? files[selectedFile] ?? "" : "";
    const [editedContent, setEditedContent] = useState(originalContent);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Reset editor when switching files
    useEffect(() => {
        const content = selectedFile ? files[selectedFile] ?? "" : "";
        setEditedContent(content);
        setHasUnsavedChanges(false);
    }, [selectedFile, files]);

    const handleContentChange = useCallback(
        (value: string) => {
            setEditedContent(value);
            setHasUnsavedChanges(value !== originalContent);
        },
        [originalContent]
    );

    // tRPC mutation for saving
    const trpc = useTRPC();
    const sandboxId = extractSandboxId(data.sandboxUrl);

    const saveFileMutation = useMutation(
        trpc.fragments.updateFile.mutationOptions({
            onSuccess: (result) => {
                if (result.success) {
                    setHasUnsavedChanges(false);
                    // Update the local files cache
                    if (selectedFile) {
                        files[selectedFile] = editedContent;
                    }
                    toast.success("File saved — preview refreshing...");
                    onPreviewRefresh?.();
                } else {
                    toast.error(result.error || "Failed to save file");
                }
            },
            onError: (error) => {
                toast.error(`Save failed: ${error.message}`);
            },
        })
    );

    const handleSave = useCallback(() => {
        if (!selectedFile || !sandboxId || !hasUnsavedChanges) return;

        saveFileMutation.mutate({
            fragmentId: data.id,
            sandboxId,
            filePath: selectedFile,
            content: editedContent,
        });
    }, [selectedFile, sandboxId, hasUnsavedChanges, editedContent, saveFileMutation]);

    // Ctrl+S keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave]);

    const handleCopy = async () => {
        if (!editedContent) return;
        await navigator.clipboard.writeText(editedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* File Explorer Sidebar */}
            <div className="w-60 shrink-0 border-r flex flex-col bg-background">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b shrink-0">
                    Files
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="py-1">
                        <TreeView
                            data={treeItems}
                            selectedFile={selectedFile}
                            onSelectFile={setSelectedFile}
                        />
                    </div>
                </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                {selectedFile ? (
                    <>
                        <div className="flex items-center justify-between border-b shrink-0 h-10">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <FilepathBreadcrumbs filePath={selectedFile} />
                                {hasUnsavedChanges && (
                                    <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" title="Unsaved changes" />
                                )}
                            </div>
                            <div className="flex items-center gap-1 pr-2 shrink-0">
                                {sandboxId && (
                                    <Button
                                        variant={hasUnsavedChanges ? "default" : "ghost"}
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={handleSave}
                                        disabled={!hasUnsavedChanges || saveFileMutation.isPending}
                                    >
                                        {saveFileMutation.isPending ? (
                                            <Loader2Icon className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <SaveIcon className="h-3 w-3" />
                                        )}
                                        Save
                                    </Button>
                                )}
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
                        <div className="flex-1 overflow-hidden">
                            <textarea
                                value={editedContent}
                                onChange={(e) => handleContentChange(e.target.value)}
                                className="h-full w-full resize-none border-none outline-none bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground"
                                spellCheck={false}
                                autoCapitalize="off"
                                autoCorrect="off"
                            />
                        </div>
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
