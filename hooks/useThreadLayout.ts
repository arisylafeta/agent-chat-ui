import { useCallback, useEffect, useState } from "react";
import { useArtifactContext, useArtifactOpen } from "../components/artifact/artifact";

interface OnArtifactCloseOptions {
  wait?: number;
}

export function useThreadLayout() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [artifactOpenForLayout, setArtifactOpenForLayout] = useState(artifactOpen);
  const [blankArtifactBackground, setBlankArtifactBackground] = useState(false);

  useEffect(() => {
    if (artifactOpen) {
      setArtifactOpenForLayout(true);
      return;
    }

    const timer = setTimeout(() => {
      setArtifactOpenForLayout(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [artifactOpen]);

  const onArtifactClose = useCallback(async (opts?: OnArtifactCloseOptions) => {
    const waitMs = opts?.wait ?? 150;
    setBlankArtifactBackground(true);

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    closeArtifact();

    setTimeout(() => setBlankArtifactBackground(false), 700);
  }, [closeArtifact]);

  return {
    artifactContext,
    setArtifactContext,
    artifactOpen,
    closeArtifact,
    artifactOpenForLayout,
    blankArtifactBackground,
    onArtifactClose,
  };
}
