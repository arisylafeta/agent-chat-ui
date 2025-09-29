import { useCallback } from "react";
import { useArtifactContext, useArtifactOpen } from "../components/artifact/artifact";

export function useChatArtifact() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const onArtifactClose = useCallback(async (opts?: { wait?: number }) => {
    const waitMs = opts?.wait ?? 150;
    
    // Add a small delay before closing for smooth UX
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    closeArtifact();
  }, [closeArtifact]);

  return {
    artifactContext,
    setArtifactContext,
    artifactOpen,
    closeArtifact,
    onArtifactClose,
  };
}
