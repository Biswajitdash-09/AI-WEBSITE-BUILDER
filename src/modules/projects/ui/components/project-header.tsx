"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    EditIcon,
    SunMoonIcon,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const { setTheme } = useTheme();

    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
    );

    return (
        <header className="flex h-12 items-center justify-between border-b px-4 shrink-0">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <Link href="/">
                        <ChevronLeftIcon className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-sm truncate max-w-[200px]">{project.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <EditIcon className="h-3 w-3 text-muted-foreground" />
                    </Button>
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

                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDownIcon className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
};
