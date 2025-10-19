"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useArtifact } from "@/components/artifact/artifact";
import { Studio } from "@/components/artifact/studio/studio";

/**
 * Context for manually triggering the Studio artifact
 * This allows the StudioToggle button to open the Studio artifact
 * without requiring a chat message
 */

interface StudioArtifactContextType {
  shouldRenderStudio: boolean;
  openStudio: () => void;
  closeStudio: () => void;
}

const StudioArtifactContext = createContext<StudioArtifactContextType | null>(null);

export function StudioArtifactProvider({ children }: { children: ReactNode }) {
  const [shouldRenderStudio, setShouldRenderStudio] = useState(false);

  const openStudio = useCallback(() => {
    setShouldRenderStudio(true);
  }, []);

  const closeStudio = useCallback(() => {
    setShouldRenderStudio(false);
  }, []);

  return (
    <StudioArtifactContext.Provider value={{ shouldRenderStudio, openStudio, closeStudio }}>
      {children}
      <ManualStudioRenderer />
    </StudioArtifactContext.Provider>
  );
}

export function useStudioArtifactTrigger() {
  const context = useContext(StudioArtifactContext);
  if (!context) {
    throw new Error("useStudioArtifactTrigger must be used within StudioArtifactProvider");
  }
  return context;
}

/**
 * ManualStudioRenderer
 * Renders a hidden Studio component that can be triggered manually via StudioToggle
 * This allows the Studio to open in the artifact sidebar without requiring a chat message
 */
function ManualStudioRenderer() {
  const { shouldRenderStudio, closeStudio } = useStudioArtifactTrigger();
  const [ArtifactContent, { setOpen, open }] = useArtifact();
  const [hasOpened, setHasOpened] = useState(false);

  // Open artifact when triggered
  // Always call setOpen when shouldRenderStudio is true to ensure Studio takes over the artifact slot
  useEffect(() => {
    if (shouldRenderStudio) {
      setOpen(true);
    }
  }, [shouldRenderStudio, setOpen]);

  // Track when artifact has successfully opened
  useEffect(() => {
    if (open && shouldRenderStudio) {
      setHasOpened(true);
    }
  }, [open, shouldRenderStudio]);

  // Close trigger state when artifact closes (but only after it has opened at least once)
  useEffect(() => {
    if (!open && shouldRenderStudio && hasOpened) {
      closeStudio();
      setHasOpened(false);
    }
  }, [open, shouldRenderStudio, hasOpened, closeStudio]);

  // When shouldRenderStudio becomes false, ensure artifact is closed
  useEffect(() => {
    if (!shouldRenderStudio && open) {
      setOpen(false);
    }
  }, [shouldRenderStudio, open, setOpen]);

  // Don't render anything if not triggered
  if (!shouldRenderStudio) {
    return null;
  }

  // Render Studio through artifact system
  return (
    <ArtifactContent title="Studio">
      <Studio />
    </ArtifactContent>
  );
}
