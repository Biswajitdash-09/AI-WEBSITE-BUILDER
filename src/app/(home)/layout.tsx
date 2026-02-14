import Image from "next/image";
import Link from "next/link";
import { UserControl } from "./components/user-control";

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
                        alt="Vibe"
                        width={28}
                        height={28}
                    />
                    <span className="font-semibold text-lg">Vibe</span>
                </Link>
                <UserControl />
            </nav>
            {children}
        </div>
    );
}
