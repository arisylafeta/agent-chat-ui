"use client";

import React, { useEffect, useState } from "react";
import { ArtifactContent, ArtifactTitle, useArtifactBoundingBox } from "./artifact";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function ArtifactSidebar({
  onClose,
  className,
  headerClassName,
  titleClassName,
  contentClassName,
  open = true,
  isSidebarOpen = false,
  blankBackground = false,
}: {
  onClose: () => void;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  open?: boolean;
  isSidebarOpen?: boolean;
  /**
   * When true, forces the full-screen background filler to be opaque even while open.
   * This is used to blank the underlying thread BEFORE any close animation starts,
   * matching the behavior in supabase-ui where the chat blanks immediately.
   */
  blankBackground?: boolean;
}) {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const [vh, setVh] = useState(0);
  const bb = useArtifactBoundingBox();

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
            className="col-start-1 md:col-start-2 z-20 flex h-dvh min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto border-zinc-200 bg-background md:border-l dark:border-zinc-700 dark:bg-muted pointer-events-auto"
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
            <div className={cn("flex flex-row items-start justify-between p-2", headerClassName)}>
              <div className="flex flex-row items-start gap-4">
                <button onClick={onClose} className="cursor-pointer" aria-label="Close artifact">
                  <XIcon className="size-5" />
                </button>

                <div className="flex flex-col">
                  <ArtifactTitle className={cn("font-medium", titleClassName)} />
                </div>
              </div>
            </div>

            <div className={cn("h-full items-stretch overflow-y-auto bg-background dark:bg-muted", contentClassName)}>
              <ArtifactContent className={cn("min-h-full", contentClassName)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

