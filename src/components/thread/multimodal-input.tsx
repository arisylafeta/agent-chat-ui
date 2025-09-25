import React, { FormEvent } from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Camera, LoaderCircle, ArrowUp } from "lucide-react";
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
    <form onSubmit={onSubmit} className="grid grid-rows-[1fr_auto] gap-2 w-full">
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
        placeholder="Send a message..."
        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 text-sm shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
      />

      <div className="flex items-center gap-6 p-2 pt-4">
        <Label
          htmlFor="file-input"
          className="inline-flex aspect-square h-8 items-center justify-center rounded-lg p-1 transition-colors hover:bg-accent cursor-pointer"
          aria-label="Upload file"
        >
          <Camera size={14} aria-hidden style={{ width: 14, height: 14 }} />
          <span className="sr-only">Upload file</span>
        </Label>
        <input
          id="file-input"
          type="file"
          onChange={onFileChange}
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          className="hidden"
        />
        {isLoading ? (
          <Button key="stop" onClick={onStop} className="ml-auto">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Cancel
          </Button>
        ) : (
          <Button
            type="submit"
            aria-label="Send message"
            className="ml-auto size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            disabled={isLoading || (!input.trim() && contentBlocks.length === 0)}
          >
            <ArrowUp size={14} />
          </Button>
        )}
      </div>
    </form>
  );
}
