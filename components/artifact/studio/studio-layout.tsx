"use client";

import React from "react";
import { useStudio } from "@/providers/studio-provider";
import { SelectedGrid } from "./selected-grid";
import { OutfitColumn } from "./outfit-column";
import { LookDisplay } from "./look-display";
import { BottomActions } from "./bottom-actions";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";

/**
 * Studio Layout Component
 * Responsive layout structure for the Studio artifact
 */
export function StudioLayout() {
  const { state } = useStudio();

  const handleProductsClick = () => {
    toast.info("Shopping history coming soon");
    posthog.capture("studio_products_clicked", {
      feature: "studio",
      action: "products_button_clicked",
      source: "empty_state_cta",
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Main Content: Responsive Grid Layout */}
      <div className="flex flex-1 flex-col overflow-hidden min-[75rem]:flex-row">
        {/* Main Section: Center Image + Outfit Column - FIXED WIDTH, ALWAYS FULL HEIGHT */}
        <div className="flex h-full flex-col overflow-hidden min-[75rem]:w-[640px] min-[75rem]:flex-shrink-0">
          <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
            <div className="flex h-full w-full flex-col gap-4">
              <h3 className="text-lg font-medium text-black-soft">
                Your Outfit
              </h3>

              {/* Top Row: Outfit Column + Center Image - wrapped in single container */}
              <div className="flex flex-1 items-center justify-center gap-4 md:gap-6 lg:gap-8">
                {/* Outfit Column and Center Image share height */}
                <OutfitColumn />

                {/* Center Image Display */}
                <LookDisplay />
              </div>

              {/* Bottom Action Buttons (full width) */}
              <BottomActions />
            </div>
          </div>

          {/* Empty State CTA - Below Main Content (Desktop Only) */}
          <div className="hidden min-[75rem]:block border-t border-gray-soft bg-gray-soft px-4 sm:px-6">
            <Empty className="gap-3 border-0 p-0 py-3">
              <EmptyHeader>
                <EmptyMedia>
                  <img
                    src="/products.png"
                    alt="Product Collection"
                    className="h-24 w-24 object-contain"
                  />
                </EmptyMedia>
                <EmptyTitle>Looking for Inspiration?</EmptyTitle>
                <EmptyDescription>
                  Head over to our Product Collection for some personalized suggestions based on this outfit.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                onClick={handleProductsClick}
                className="gap-2"
                size="default"
              >
                <ShoppingBag className="h-4 w-4" />
                Browse Products
              </Button>
            </Empty>
          </div>
        </div>

        {/* Selected Section: Product Grid - FLEXIBLE WIDTH, SCALES DOWN */}
        <div className="flex flex-1 flex-col border-t border-gray-soft min-[75rem]:border-l min-[75rem]:border-t-0">
          <div className="border-b border-gray-soft px-4 py-3 sm:px-6">
            <h3 className="text-lg font-medium text-black-soft">
              Selected Products {state.selectedProducts.length > 0 && `(${state.selectedProducts.length})`}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <SelectedGrid />
          </div>
        </div>
      </div>
    </div>
  );
}
