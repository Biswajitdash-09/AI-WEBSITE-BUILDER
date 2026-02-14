"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeftIcon,
    EditIcon,
    SunMoonIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const { setTheme } = useTheme();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [projectName, setProjectName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
    );

    const updateProject = useMutation(trpc.projects.update.mutationOptions({
        onSuccess: () => {
            // Invalidate getOne for this project
            queryClient.invalidateQueries({
                queryKey: [['projects', 'getOne'], { input: { id: projectId }, type: 'query' }]
            });
            // Invalidate getMany
            queryClient.invalidateQueries({
                queryKey: [['projects', 'getMany']]
            });
            setIsEditing(false);
            toast.success("Project name updated");
        },
        onError: () => {
            toast.error("Failed to update project name");
        }
    }));

    const handleEditClick = () => {
        setProjectName(project.name);
        setIsEditing(true);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleSave = () => {
        if (!projectName.trim()) return;

        if (projectName === project.name) {
            setIsEditing(false);
            return;
        }

        updateProject.mutate({
            id: projectId,
            name: projectName,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setProjectName(project.name);
        }
    };

    return (
        <header className="flex h-12 items-center justify-between border-b px-4 shrink-0">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <Link href="/">
                        <ChevronLeftIcon className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-1.5 font-medium">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <Input
                                ref={inputRef}
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                className="h-7 w-[360px] text-sm"
                            />
                        </div>
                    ) : (
                        <>
                            <span className="text-sm truncate max-w-[300px]">{project.name}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleEditClick}
                            >
                                <EditIcon className="h-3 w-3 text-muted-foreground" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <SunMoonIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            System
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
