"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SendHorizonalIcon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { PROJECT_TEMPLATES } from "../constants";

interface Props {
    onNavigate?: () => void;
}

export function ProjectForm({ onNavigate }: Props) {
    const router = useRouter();
    const [value, setValue] = useState("");
    const trpc = useTRPC();

    const createProject = useMutation(
        trpc.projects.create.mutationOptions({
            onError: (error) => {
                toast.error(error.message);
            },
            onSuccess: (data) => {
                if (onNavigate) onNavigate();
                router.push(`/projects/${data.id}`);
            },
        })
    );

    const handleSubmit = () => {
        if (!value.trim()) return;
        createProject.mutate({ value: value.trim() });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleTemplateClick = (prompt: string) => {
        setValue(prompt);
        createProject.mutate({ value: prompt });
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            {/* Input */}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What would you like to build?"
                    disabled={createProject.isPending}
                    className="w-full rounded-xl border bg-background px-4 py-3 pr-12 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring/50 transition-shadow disabled:opacity-50"
                />
                <Button
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                    disabled={createProject.isPending || !value.trim()}
                    onClick={handleSubmit}
                >
                    <SendHorizonalIcon className="h-4 w-4" />
                </Button>
            </div>

            {/* Hint */}
            <p className="text-xs text-muted-foreground text-center">
                ⌘ Enter to submit
            </p>

            {/* Templates */}
            <div className="flex flex-wrap justify-center gap-2">
                {PROJECT_TEMPLATES.map((template) => (
                    <button
                        key={template.title}
                        onClick={() => handleTemplateClick(template.prompt)}
                        disabled={createProject.isPending}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <span>{template.emoji}</span>
                        <span>{template.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
