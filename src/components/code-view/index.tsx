"use client";

import Prism from "prismjs";
import { useEffect } from "react";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "./code-theme.css";

interface CodeViewProps {
    code: string;
    language?: string;
}

export function CodeView({ code, language = "tsx" }: CodeViewProps) {
    useEffect(() => {
        Prism.highlightAll();
    }, [code]);

    return (
        <pre className="text-sm">
            <code className={`language-${language}`}>{code}</code>
        </pre>
    );
}
