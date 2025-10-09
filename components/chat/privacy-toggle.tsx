"use client";

import { useState } from "react";
import { Lock, LockOpen, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface PrivacyToggleProps {
  threadId: string;
  isPublic: boolean;
  onUpdate?: () => void;
}

export function PrivacyToggle({
  threadId,
  isPublic,
  onUpdate,
}: PrivacyToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);

  const handleTogglePrivacy = async (newIsPublic: boolean) => {
    if (newIsPublic === currentIsPublic) return;
    
    setIsLoading(true);
    try {
      // Update directly in Supabase (faster, no backend overhead)
      const supabase = createClient();
      const { error } = await supabase
        .from('thread')
        .update({ is_public: newIsPublic, updated_at: new Date().toISOString() })
        .eq('thread_id', threadId);

      if (error) throw error;

      setCurrentIsPublic(newIsPublic);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update privacy:", error);
      alert("Failed to update privacy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={isLoading}
          aria-label={currentIsPublic ? "Public thread" : "Private thread"}
        >
          {currentIsPublic ? (
            <LockOpen className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem
          onClick={() => handleTogglePrivacy(false)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Private</span>
          </div>
          {!currentIsPublic && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleTogglePrivacy(true)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <LockOpen className="h-4 w-4" />
            <span>Public</span>
          </div>
          {currentIsPublic && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
