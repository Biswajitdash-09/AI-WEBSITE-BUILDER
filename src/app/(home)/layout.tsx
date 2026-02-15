import Image from "next/image";
import Link from "next/link";
import { UserControl } from "./components/user-control";
import { ThemeToggle } from "@/components/theme-toggle";

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
        </div>
    );
}
