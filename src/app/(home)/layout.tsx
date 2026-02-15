import Image from "next/image";
import Link from "next/link";
import { UserControl } from "./components/user-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { MailIcon, LinkedinIcon } from "lucide-react";

export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-background">
            <nav className="flex items-center justify-between border-b px-6 h-14">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo.svg"
                        alt="SiteForge"
                        width={28}
                        height={28}
                    />
                    <span className="font-semibold text-lg">SiteForge</span>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <UserControl />
                </div>
            </nav>
            {children}
            <footer className="border-t py-8 bg-muted/30">
                <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-sm font-medium text-muted-foreground">Founder & Developer</p>
                        <p className="text-base font-semibold text-foreground">Biswajit Dash</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <a
                            href="mailto:biswajitdash929@gmail.com"
                            className="flex items-center gap-2 hover:text-foreground transition-colors group"
                        >
                            <MailIcon className="h-4 w-4 group-hover:text-rose-500 transition-colors" />
                            <span>Email</span>
                        </a>
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <a
                            href="https://www.linkedin.com/in/biswajitdash09"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-foreground transition-colors group"
                        >
                            <LinkedinIcon className="h-4 w-4 group-hover:text-blue-500 transition-colors" />
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
