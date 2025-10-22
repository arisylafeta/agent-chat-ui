"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";

type ArtifactDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

/**
 * Reusable drawer component for artifact panels.
 *
 * Provides consistent styling and behavior:
 * - Portals to [data-artifact-panel] container
 * - Max height of 60vh
 * - Absolute positioning within artifact panel
 * - Dark overlay background
 * - Consistent white-soft/zinc-900 background
 *
 * Usage:
 * ```tsx
 * <ArtifactDrawer open={isOpen} onOpenChange={setIsOpen}>
 *   <YourDrawerContent />
 * </ArtifactDrawer>
 * ```
 */
export function ArtifactDrawer({ open, onOpenChange, children }: ArtifactDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        shouldStretch={false}
        overlayClassName="bg-black/40"
        portalProps={{
          container: typeof document !== 'undefined'
            ? document.querySelector('[data-artifact-panel]')
            : undefined
        }}
        className="absolute left-0 right-0 bottom-0 w-full max-h-[60vh] bg-white-soft dark:bg-zinc-900 border-t border-gray-200"
      >
        {children}
      </DrawerContent>
    </Drawer>
  );
}
