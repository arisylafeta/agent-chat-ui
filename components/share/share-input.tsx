"use client";

import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";

interface ShareInputProps {
  onInteract: () => void;
}

export function ShareInput({ onInteract }: ShareInputProps) {
  return (
    <div 
      className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 shadow-sm cursor-pointer hover:border-accent-2 transition-colors"
      onClick={onInteract}
    >
      {/* Attachment button (disabled) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Input placeholder */}
      <div className="flex-1 text-sm text-muted-foreground">
        Login to send a message...
      </div>

      {/* Send button (disabled) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
