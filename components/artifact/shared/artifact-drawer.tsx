"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type ArtifactDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
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
 * <ArtifactDrawer open={isOpen} onOpenChange={setIsOpen} title="Drawer Title">
 *   <YourDrawerContent />
 * </ArtifactDrawer>
 * ```
 */
export function ArtifactDrawer({ open, onOpenChange, children, title }: ArtifactDrawerProps) {
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
        {title ? (
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
        ) : (
          <VisuallyHidden>
            <DrawerTitle>Drawer</DrawerTitle>
          </VisuallyHidden>
        )}
        {children}
      </DrawerContent>
    </Drawer>
  );
}
