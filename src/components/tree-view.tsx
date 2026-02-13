"use client";

import { useState } from "react";
import {
    ChevronDownIcon,
    ChevronRightIcon,
    FileIcon,
    FolderIcon,
    FolderOpenIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type TreeItem } from "@/types";

interface TreeViewProps {
    data: TreeItem[];
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
}

export function TreeView({ data, selectedFile, onSelectFile }: TreeViewProps) {
    return (
        <div className="text-sm">
            {data.map((item, index) => (
                <TreeNode
                    key={index}
                    item={item}
                    selectedFile={selectedFile}
                    onSelectFile={onSelectFile}
                    depth={0}
                    parentPath=""
                />
            ))}
        </div>
    );
}

interface TreeNodeProps {
    item: TreeItem;
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
    depth: number;
    parentPath: string;
}

function TreeNode({
    item,
    selectedFile,
    onSelectFile,
    depth,
    parentPath,
}: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState(true);

    // If item is a string, it's a file
    if (typeof item === "string") {
        const fullPath = parentPath ? `${parentPath}/${item}` : item;
        return (
            <button
                className={cn(
                    "flex items-center gap-1.5 w-full px-2 py-1 text-left hover:bg-muted/50 rounded-sm transition-colors",
                    selectedFile === fullPath && "bg-muted text-foreground font-medium",
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => onSelectFile(fullPath)}
            >
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item}</span>
            </button>
        );
    }

    // If item is an array, first element is folder name, rest are children
    if (Array.isArray(item) && item.length > 0) {
        const [folderName, ...children] = item;
        const displayName = typeof folderName === "string" ? folderName : "folder";
        const currentPath = parentPath ? `${parentPath}/${displayName}` : displayName;

        return (
            <div>
                <button
                    className="flex items-center gap-1.5 w-full px-2 py-1 text-left hover:bg-muted/50 rounded-sm transition-colors"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <ChevronDownIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                    ) : (
                        <ChevronRightIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                    {isOpen ? (
                        <FolderOpenIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                        <FolderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{displayName}</span>
                </button>
                {isOpen && (
                    <div>
                        {children.map((child, index) => (
                            <TreeNode
                                key={index}
                                item={child}
                                selectedFile={selectedFile}
                                onSelectFile={onSelectFile}
                                depth={depth + 1}
                                parentPath={currentPath}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
