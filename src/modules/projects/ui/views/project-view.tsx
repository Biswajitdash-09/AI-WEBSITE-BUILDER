"use client";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { FragmentCode } from "../components/fragment-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense, useCallback, useState } from "react";
import { Fragment } from "@/generated/prisma/client";
import { Code2Icon, GlobeIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";

interface Props {
    projectId: string;
};

export const ProjectView = ({ projectId }: Props) => {
    const { openUserProfile } = useClerk();
    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
    const [previewKey, setPreviewKey] = useState(0);

    const handlePreviewRefresh = useCallback(() => {
        // Small delay to let the sandbox hot-reload pick up the file change
        setTimeout(() => {
            setPreviewKey((prev) => prev + 1);
        }, 1000);
    }, []);

    return (
        <div className="h-screen">
            <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel
                    defaultSize={35}
                    minSize={20}
                    className="flex flex-col min-h-0"
                >
                    <ProjectHeader projectId={projectId} />
                    <Suspense fallback={<p>Loading messages...</p>}>

                        <MessagesContainer
                            projectId={projectId}
                            activeFragment={activeFragment}
                            setActiveFragment={setActiveFragment}
                        />

                    </Suspense>

                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                    defaultSize={65}
                    minSize={50}
                >
                    {!!activeFragment ? (
                        <Tabs defaultValue="demo" className="h-full flex flex-col">
                            <div className="flex items-center justify-between border-b px-4 h-12 shrink-0">
                                <TabsList>
                                    <TabsTrigger value="demo">
                                        <GlobeIcon className="h-4 w-4 mr-1.5" />
                                        Demo
                                    </TabsTrigger>
                                    <TabsTrigger value="code">
                                        <Code2Icon className="h-4 w-4 mr-1.5" />
                                        Code
                                    </TabsTrigger>
                                </TabsList>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => openUserProfile()}
                                >
                                    <SparklesIcon className="h-4 w-4 mr-1.5" />
                                    Upgrade
                                </Button>
                            </div>
                            <TabsContent value="demo" className="flex-1 m-0">
                                <FragmentWeb
                                    key={previewKey}
                                    data={activeFragment}
                                />
                            </TabsContent>
                            <TabsContent value="code" className="flex-1 m-0 overflow-hidden min-h-0">
                                <FragmentCode
                                    data={activeFragment}
                                    onPreviewRefresh={handlePreviewRefresh}
                                />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Select a fragment to preview
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>

        </div>
    );
};