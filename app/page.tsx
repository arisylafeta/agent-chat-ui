"use client";

import { Thread } from "../components/chat/chat";
import { StreamProvider } from "../providers/Stream";
import { ThreadProvider } from "../providers/Thread";
import { ArtifactProvider } from "../components/artifact/artifact";
import { Toaster } from "../components/ui/sonner";
import React from "react";

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>
          <ArtifactProvider>
            <Thread />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
