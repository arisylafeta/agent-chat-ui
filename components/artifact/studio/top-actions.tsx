"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, Shirt } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useStudio } from "@/providers/studio-provider";
import { AvatarGenerationDialog } from "@/components/lookbook/avatar-generation-dialog";

/**
 * Top Actions Component
 * Button group for drawer triggers (Avatar, Products, Wardrobe)
 */
export function TopActions() {
  const { setSelectedAvatar, state } = useStudio();
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // Load user's avatar on mount
  useEffect(() => {
    const loadAvatar = async () => {
      if (state.selectedAvatar) return; // Already loaded
      
      setIsLoadingAvatar(true);
      try {
        const response = await fetch('/api/lookbook/avatar');
        if (response.ok) {
          const { avatar } = await response.json();
          if (avatar) {
            setSelectedAvatar(avatar);
          }
        }
      } catch (error) {
        console.error('Failed to load avatar:', error);
      } finally {
        setIsLoadingAvatar(false);
      }
    };

    loadAvatar();
  }, [setSelectedAvatar, state.selectedAvatar]);

  const handleAvatarClick = () => {
    setShowAvatarDialog(true);
    posthog.capture("studio_avatar_clicked", {
      feature: "studio",
      action: "avatar_button_clicked",
      has_avatar: !!state.selectedAvatar,
    });
  };

  const handleProductsClick = () => {
    toast.info("Shopping history coming soon");
    posthog.capture("studio_products_clicked", {
      feature: "studio",
      action: "products_button_clicked",
    });
  };

  const handleWardrobeClick = () => {
    toast.info("Wardrobe coming soon");
    posthog.capture("studio_wardrobe_clicked", {
      feature: "studio",
      action: "wardrobe_button_clicked",
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAvatarClick}
          disabled={isLoadingAvatar}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          Avatar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleProductsClick}
          className="gap-2"
        >
          <ShoppingBag className="h-4 w-4" />
          Products
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleWardrobeClick}
          className="gap-2"
        >
          <Shirt className="h-4 w-4" />
          Wardrobe
        </Button>
      </div>

      {/* Avatar Generation Dialog */}
      <AvatarGenerationDialog
        open={showAvatarDialog}
        onClose={() => setShowAvatarDialog(false)}
        onGenerate={async (data) => {
          // Generate avatar via API
          const formData = new FormData();
          formData.append('headImage', data.headImage);
          formData.append('bodyImage', data.bodyImage);
          formData.append('measurements', JSON.stringify(data.measurements));
          if (data.regenerationNote) {
            formData.append('regenerationNote', data.regenerationNote);
          }

          const response = await fetch('/api/lookbook/generate-avatar', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to generate avatar');
          }

          return await response.json();
        }}
        onSave={async (avatarData) => {
          try {
            // Save avatar via API
            const response = await fetch('/api/lookbook/avatar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(avatarData),
            });
            
            if (response.ok) {
              const { avatar } = await response.json();
              setSelectedAvatar(avatar);
              setShowAvatarDialog(false);
              toast.success("Avatar updated successfully!");
            } else {
              throw new Error('Failed to save avatar');
            }
          } catch (error) {
            console.error('Error saving avatar:', error);
            toast.error("Failed to save avatar");
          }
        }}
      />
    </>
  );
}
