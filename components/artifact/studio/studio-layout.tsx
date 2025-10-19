"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { SelectedGrid } from "./selected-grid";
import { OutfitColumn } from "./outfit-column";
import { LookDisplay } from "./look-display";
import { BottomActions } from "./bottom-actions";

/**
 * Studio Layout Component
 * Responsive layout structure for the Studio artifact
 */
export function StudioLayout() {
  const { state } = useStudio();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Main Content: Responsive Grid Layout */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Main Section: Center Image + Outfit Column */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-6 lg:w-1/2">
          <div className="flex h-full w-full flex-col gap-4">
            {/* Top Row: Outfit Column + Center Image - wrapped in single container */}
            <div className="flex flex-1 items-stretch justify-around">
              {/* Outfit Column and Center Image share height */}
              <OutfitColumn />
              
              {/* Center Image Display */}
              <LookDisplay />
            </div>
            
            {/* Bottom Action Buttons (full width) */}
            <BottomActions />
          </div>
        </div>

        {/* Selected Section: Product Grid */}
        <div className="flex flex-col border-t border-gray-soft lg:w-1/2 lg:border-l lg:border-t-0">
          <div className="border-b border-gray-soft px-6 py-3">
            <h3 className="text-lg font-medium text-black-soft">
              Selected Products {state.selectedProducts.length > 0 && `(${state.selectedProducts.length})`}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <SelectedGrid />
          </div>
        </div>
      </div>
    </div>
  );
}
