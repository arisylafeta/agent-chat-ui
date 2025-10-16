"use client";

import React from "react";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/artifact/artifact";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThreadProvider>
      <StreamProvider>
        <ArtifactProvider>
          {children}
        </ArtifactProvider>
      </StreamProvider>
    </ThreadProvider>
  );
}
