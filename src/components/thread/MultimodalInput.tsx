import React, { FormEvent } from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Camera, LoaderCircle } from "lucide-react";
import { ContentBlocksPreview } from "./ContentBlocksPreview";

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
        placeholder="Type your message..."
        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
      />

      <div className="flex items-center gap-6 p-2 pt-4">
        <Label htmlFor="file-input" className="flex cursor-pointer items-center" aria-label="Upload file">
          <Camera className="size-5 text-gray-600" aria-hidden />
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
          <Button type="submit" className="ml-auto shadow-md transition-all" disabled={isLoading || (!input.trim() && contentBlocks.length === 0)}>
            Send
          </Button>
        )}
      </div>
    </form>
  );
}
