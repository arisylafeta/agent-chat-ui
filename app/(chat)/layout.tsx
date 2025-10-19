"use client";

import React from "react";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/artifact/artifact";
import { StudioArtifactProvider } from "@/providers/studio-artifact-provider";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThreadProvider>
      <StreamProvider>
        <ArtifactProvider>
          <StudioArtifactProvider>
            {children}
          </StudioArtifactProvider>
        </ArtifactProvider>
      </StreamProvider>
    </ThreadProvider>
  );
}
