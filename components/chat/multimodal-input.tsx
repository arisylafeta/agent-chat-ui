import React, { FormEvent } from "react";
import { Button } from "../ui/button";
import { Camera, ArrowUp, Square } from "lucide-react";
import { ContentBlocksPreview } from "./contentblocks-preview";

export function MultimodalInput(props: {
  input: string;
  setInput: (v: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  contentBlocks: any[];
  onRemoveBlock: (idx: number) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  onStop: () => void;
}) {
  const {
    input,
    setInput,
    onPaste,
    onSubmit,
    contentBlocks,
    onRemoveBlock,
    onFileChange,
    isLoading,
    onStop,
  } = props;

  return (
    <form onSubmit={onSubmit} className="grid grid-rows-[1fr_auto] gap-2 w-full px-2 sm:px-0">
      <ContentBlocksPreview blocks={contentBlocks as any} onRemove={onRemoveBlock} />

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !(e as React.KeyboardEvent).shiftKey &&
            !(e as React.KeyboardEvent).metaKey &&
            !(e as any).nativeEvent.isComposing
          ) {
            e.preventDefault();
            const el = e.target as HTMLElement | undefined;
            const form = el?.closest("form");
            form?.requestSubmit();
          }
        }}
        placeholder="Type your message..."
        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
      />

      <div className="flex items-center gap-4 p-2 pt-4">
        {/* Camera icon button centered inside a circular button */}
        <Button
          type="button"
          variant="ghost"
          className="aspect-square h-8 rounded-full p-1.5 transition-colors hover:bg-accent"
          aria-label="Upload file"
          onClick={() => {
            const inputEl = document.getElementById("file-input") as HTMLInputElement | null;
            inputEl?.click();
          }}
        >
          <Camera className="h-5 w-5 text-gray-600" aria-hidden />
        </Button>
        <input
          id="file-input"
          type="file"
          onChange={onFileChange}
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          className="sr-only"
        />

        {/* Action buttons aligned to the right */}
        <div className="ml-auto flex items-center gap-2">
          {isLoading ? (
            <Button
              key="stop"
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="size-8 rounded-full bg-foreground p-1.5 text-background transition-colors hover:bg-foreground/90"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              aria-label="Send message"
              className="size-8 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              disabled={isLoading || (!input.trim() && contentBlocks.length === 0)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

