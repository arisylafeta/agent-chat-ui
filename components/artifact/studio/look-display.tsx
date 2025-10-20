"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Loader2 } from "lucide-react";

/**
 * Look Display Component
 * Center image display for avatar and generated looks
 */
export function LookDisplay() {
  const { state } = useStudio();
  const { generatedLook, isGenerating, selectedAvatar } = state;

  // BUG the images from column outfit are not always being sent to the backend, especially if the user refreshes.

  return (
    <div className="relative w-full max-w-md">
      {/* Aspect ratio container (3:4 portrait) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-gray-soft bg-gray-soft/30">
        {generatedLook ? (
          // Generated look
          <img
            src={generatedLook.imageUrl}
            alt="Generated look"
            className={`h-full w-full object-cover transition-all ${isGenerating ? 'blur-sm' : ''}`}
          />
        ) : selectedAvatar ? (
          // Show user's avatar
          <img
            src={selectedAvatar.image_url}
            alt="Your avatar"
            className={`h-full w-full object-cover transition-all ${isGenerating ? 'blur-sm' : ''}`}
          />
        ) : (
          // Default state (no avatar)
          <Empty className="gap-6">
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

        {/* Loading overlay (when generating) - covers all states */}
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black-soft/60">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-white" />
              <div className="text-center px-4">
                <p className="text-base font-semibold text-white">Generating your look...</p>
                <p className="text-sm text-white/90 mt-2">This may take up to 30 seconds</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
