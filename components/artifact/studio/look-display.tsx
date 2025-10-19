"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Loader2, User } from "lucide-react";

/**
 * Look Display Component
 * Center image display for avatar and generated looks
 */
export function LookDisplay() {
  const { state } = useStudio();
  const { generatedLook, isGenerating, selectedAvatar } = state;

  return (
    <div className="relative h-full w-full max-w-md">
      {/* Aspect ratio container (3:4 portrait) */}
      <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-gray-soft bg-gray-soft/30">
        {isGenerating ? (
          // Loading state
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-4">
              {/* Loading avatar */}
              <div className="rounded-full bg-gray-soft p-4 animate-pulse">
                <User className="h-16 w-16 text-black-soft/60" />
              </div>
              {/* Loading spinner */}
              <Loader2 className="h-8 w-8 animate-spin text-accent-2" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-black-soft">Generating your look...</p>
              <p className="text-xs text-black-soft/60">This may take up to 30 seconds</p>
            </div>
          </div>
        ) : generatedLook ? (
          // Generated look
          <img
            src={generatedLook.imageUrl}
            alt="Generated look"
            className="h-full w-full object-cover"
          />
        ) : selectedAvatar ? (
          // Show user's avatar
          <img
            src={selectedAvatar.image_url}
            alt="Your avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          // Default state (no avatar)
          <Empty className="gap-4">
            <EmptyHeader>
              <EmptyMedia>
                <img
                  src="/lookbook.png"
                  alt="Avatar"
                  className="w-40 h-40 rounded-full"
                />
              </EmptyMedia>
              <EmptyTitle>Loading...</EmptyTitle>
              <EmptyDescription>Please hang tight, we're loading your avatar</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {/* Loading overlay (when generating) */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black-soft/20 backdrop-blur-sm" />
        )}
      </div>
    </div>
  );
}
