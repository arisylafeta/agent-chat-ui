"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { Loader2, User } from "lucide-react";
import Image from "next/image";

/**
 * Look Display Component
 * Center image display for avatar and generated looks
 */
export function LookDisplay() {
  const { state } = useStudio();
  const { generatedLook, isGenerating } = state;

  return (
    <div className="relative w-full max-w-md">
      {/* Aspect ratio container (3:4 portrait) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-gray-soft bg-gray-soft/30">
        {isGenerating ? (
          // Loading state
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-accent-2" />
            <p className="text-sm font-medium text-black-soft">Generating your look...</p>
            <p className="text-xs text-black-soft/60">This may take up to 30 seconds</p>
          </div>
        ) : generatedLook ? (
          // Generated look
          <Image
            src={generatedLook.imageUrl}
            alt="Generated look"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          // Default state (placeholder avatar)
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-gray-soft p-6">
              <User className="h-16 w-16 text-black-soft/40" />
            </div>
            <div>
              <p className="text-lg font-medium text-black-soft/60">
                Your look will appear here
              </p>
              <p className="text-sm text-black-soft/40 mt-2">
                Add items to your outfit and click Generate
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay (when generating) */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black-soft/20 backdrop-blur-sm" />
        )}
      </div>
    </div>
  );
}
