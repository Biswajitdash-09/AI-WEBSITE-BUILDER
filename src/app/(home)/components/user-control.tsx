"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UserControl() {
    return (
        <>
            <SignedIn>
                <UserButton />
            </SignedIn>
            <SignedOut>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/sign-up">Sign up</Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/sign-in">Sign in</Link>
                    </Button>
                </div>
            </SignedOut>
        </>
    );
}
