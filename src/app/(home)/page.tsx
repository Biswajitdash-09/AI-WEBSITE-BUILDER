"use client";

import Image from "next/image";
import { Suspense } from "react";
import { SignedIn } from "@clerk/nextjs";

import { ProjectForm } from "./components/project-form";
import { ProjectList } from "./components/project-list";

export default function HomePage() {
    return (
        <div className="flex flex-col items-center px-4 py-16 gap-12">
            {/* Hero */}
            <div className="flex flex-col items-center gap-4 text-center">
                <Image
                    src="/logo.svg"
                    alt="SiteForge"
                    width={48}
                    height={48}
                />
                <h1 className="text-4xl font-bold tracking-tight">
                    Build something with SiteForge
                </h1>
                <p className="text-muted-foreground text-lg">
                    Create apps and websites by chatting with AI
                </p>
            </div>

            {/* Project Form */}
            <ProjectForm />

            {/* Saved Projects - only shown when signed in */}
            <SignedIn>
                <Suspense
                    fallback={
                        <div className="text-sm text-muted-foreground">
                            Loading projects...
                        </div>
                    }
                >
                    <ProjectList />
                </Suspense>
            </SignedIn>
        </div>
    );
}
