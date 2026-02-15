"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { SendHorizonalIcon } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { PROJECT_TEMPLATES } from "../constants";

interface Props {
    onNavigate?: () => void;
}

export function ProjectForm({ onNavigate }: Props) {
    const router = useRouter();
    const { openUserProfile } = useClerk();
    const [value, setValue] = useState("");
    const trpc = useTRPC();

    const createProject = useMutation(
        trpc.projects.create.mutationOptions({
            onError: (error) => {
                if (error.data?.code === "TOO_MANY_REQUESTS") {
                    openUserProfile();
                }
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
            {/* Input */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-sm group-focus-within:opacity-100 group-focus-within:duration-200" />
                <div className="relative bg-background rounded-2xl">
                    <TextareaAutosize
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What would you like to build today?"
                        disabled={createProject.isPending}
                        minRows={4}
                        className="w-full rounded-2xl border-0 bg-background/50 px-6 py-5 pr-14 text-base shadow-xl outline-none ring-1 ring-border focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 resize-none placeholder:text-muted-foreground/60"
                    />
                    <Button
                        size="icon"
                        className="absolute right-3 bottom-3 h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-200"
                        disabled={createProject.isPending || !value.trim()}
                        onClick={handleSubmit}
                    >
                        <SendHorizonalIcon className="h-5 w-5" />
                    </Button>
                </div>
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
