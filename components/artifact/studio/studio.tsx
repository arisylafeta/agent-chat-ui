"use client";

import React from "react";
import { StudioLayout } from "./studio-layout";

/**
 * Studio Artifact Component
 * Main entry point for the Virtual Try-On Studio feature
 * Can be triggered either via chat messages (LoadExternalComponent) or manually via StudioToggle button
 * The artifact wrapping is handled by the parent (either LoadExternalComponent or ManualStudioRenderer)
 */
export function Studio() {
  return (
    <div className="flex h-full w-full flex-col">
      <StudioLayout />
    </div>
  );
}
