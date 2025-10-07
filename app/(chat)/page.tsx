"use client";

import { Thread } from "@/components/chat/chat";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/artifact/artifact";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

export default function HomePage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider threadId={null}>
          <ArtifactProvider>
            <Thread threadId={null} />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
