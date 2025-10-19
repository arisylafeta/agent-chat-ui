"use client";

import React, { useEffect, useState } from "react";
import { ArtifactContent, ArtifactTitle, useArtifactBoundingBox } from "./artifact";
import { XIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "../../hooks/use-media-queries";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StudioToggle } from "@/components/artifact/studio/studio-toggle";
import { TopActions } from "@/components/artifact/studio/top-actions";

export function ArtifactSidebar({
  onClose,
  className,
  headerClassName,
  titleClassName,
  contentClassName,
  open = true,
  blankBackground = false,
  isSidebarOpen = false,
}: {
  onClose: () => void;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  open?: boolean;
  /**
   * When true, forces the full-screen background filler to be opaque even while open.
   * This is used to blank the underlying thread BEFORE any close animation starts,
   * matching the behavior in supabase-ui where the chat blanks immediately.
   */
  blankBackground?: boolean;
  /**
   * Indicates if the thread history sidebar is currently open. When the artifact tries to open
   * and this is true, we will proactively close the thread history first.
   */
  isSidebarOpen?: boolean;
}) {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const [vh, setVh] = useState(0);
  const bb = useArtifactBoundingBox();
  const [, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [artifactTitle, setArtifactTitle] = useState<string>("");

  // Track artifact title to conditionally show Studio toggle
  // Use MutationObserver since ArtifactTitle uses portals
  useEffect(() => {
    if (!open) {
      setArtifactTitle('');
      return;
    }

    const checkTitle = () => {
      const titleElement = document.querySelector('[data-artifact-panel] .font-medium');
      if (titleElement?.textContent) {
        setArtifactTitle(titleElement.textContent);
      }
    };

    // Check immediately
    checkTitle();

    // Keep observing for title changes (e.g., when switching from lens-results to studio)
    const observer = new MutationObserver(() => {
      checkTitle();
    });

    const panel = document.querySelector('[data-artifact-panel]');
    if (panel) {
      observer.observe(panel, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      try {
        setVh(window.innerHeight || 0);
      } catch {
        // no-op
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // If the artifact is opening while the thread history sidebar is open,
  // close the thread history first so the artifact has clear space.
  useEffect(() => {
    if (open && isSidebarOpen) {
      try {
        setChatHistoryOpen(false);
      } catch {
        // no-op
      }
    }
  }, [open, isSidebarOpen, setChatHistoryOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className={cn(
            "fixed top-0 left-0 z-50 grid h-dvh w-dvw grid-cols-1 md:grid-cols-[400px_1fr] bg-transparent pointer-events-none overflow-x-hidden",
            className,
          )}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
          initial={{ opacity: 1 }}
          data-testid="artifact"
        >
          {/* Background filler to blank the underlying thread during animations */}
          <motion.div
            className="fixed inset-0 z-10 bg-background pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: blankBackground ? 1 : 0 }}
            exit={{ opacity: 1 }}
          />

          <motion.div
            animate={
              isLargeScreen
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: vh,
                    width: "100%",
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.8,
                    },
                  }
                : {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: vh,
                    width: "100%",
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.8,
                    },
                  }
            }
            className="col-start-1 md:col-start-2 z-20 flex h-dvh min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto border-zinc-200 bg-gray-soft md:border-l dark:border-zinc-700 dark:bg-muted pointer-events-auto relative"
            data-artifact-panel
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: { delay: 0.1, type: "spring", stiffness: 600, damping: 30 },
            }}
            initial={{
              opacity: 1,
              x: bb.left,
              y: bb.top,
              height: bb.height,
              width: bb.width,
              borderRadius: 50,
            }}
          >
            <div className={cn("flex flex-row items-center justify-between p-3 bg-gray-soft/95 backdrop-blur supports-[backdrop-filter]:bg-gray-soft/60 dark:bg-muted/95 dark:supports-[backdrop-filter]:bg-muted/60", headerClassName)}>
              <div className="flex flex-row items-center gap-4">
                <button onClick={onClose} className="h-fit p-2 rounded-md border border-zinc-200 hover:bg-accent/30 dark:border-zinc-700 dark:hover:bg-zinc-700" aria-label="Close artifact">
                  <XIcon className="size-4" />
                </button>

                <div className="flex flex-col">
                  <ArtifactTitle className={cn("font-medium", titleClassName)} />
                </div>
              </div>

              {/* Show TopActions when in Studio, otherwise show StudioToggle */}
              {artifactTitle.trim().toLowerCase() === 'studio' ? (
                <TopActions />
              ) : (
                <StudioToggle />
              )}
            </div>

            <div className={cn("relative h-full items-stretch overflow-y-auto bg-gray-soft dark:bg-muted", contentClassName)} data-artifact-content>
              <ArtifactContent className={cn("min-h-full", contentClassName)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

