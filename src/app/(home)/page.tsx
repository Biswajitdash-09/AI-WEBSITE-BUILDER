"use client";

import Image from "next/image";
import { Suspense } from "react";

import { ProjectForm } from "./components/project-form";
import { ProjectList } from "./components/project-list";

export default function HomePage() {
    return (
        <div className="flex flex-col items-center px-4 py-16 gap-12">
            {/* Hero */}
            <div className="flex flex-col items-center gap-4 text-center">
                <Image
                    src="/logo.svg"
                    alt="Vibe"
                    width={48}
                    height={48}
                />
                <h1 className="text-4xl font-bold tracking-tight">
                    Build something with Vibe
                </h1>
                <p className="text-muted-foreground text-lg">
                    Create apps and websites by chatting with AI
                </p>
            </div>

            {/* Project Form */}
            <ProjectForm />

            {/* Saved Projects */}
            <Suspense
                fallback={
                    <div className="text-sm text-muted-foreground">
                        Loading projects...
                    </div>
                }
            >
                <ProjectList />
            </Suspense>
        </div>
    );
}
