"use client";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { ProjectHeader } from "../components/project-header";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma/client";

interface Props {
    projectId: string;
};

export const ProjectView = ({ projectId }: Props) => {

    const [activeFragment, setFragment] = useState<Fragment | null>(null);
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
                            setActiveFragment={setFragment}

                        />

                    </Suspense>

                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                    defaultSize={65}
                    minSize={50}
                >
                    TODO: Preview
                </ResizablePanel>
            </ResizablePanelGroup>

        </div>
    );
};