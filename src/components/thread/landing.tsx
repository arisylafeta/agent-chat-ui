import React, { FormEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LangGraphLogoSVG } from "../icons/langgraph";
import { MultimodalInput } from "./multimodal-input";

export function Landing(props: {
  contentClassName: string;
  dropRef: React.Ref<HTMLDivElement>;
  dragOver: boolean;
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
    contentClassName,
    dropRef,
    dragOver,
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
    <motion.div 
      className="flex flex-1 min-h-0 flex-col"
      initial={{ y: 0 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div 
        className="h-[30vh] flex flex-col items-center justify-center gap-6"
        initial={{ y: 0 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className={contentClassName}>
          <motion.div 
            className="flex items-center gap-3 justify-center mb-4"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <LangGraphLogoSVG className="h-8 flex-shrink-0" />
            <h1 className="text-2xl font-semibold tracking-tight">Agent Chat</h1>
          </motion.div>
          <motion.div
            ref={dropRef}
            className={cn(
              "bg-muted relative z-10 w-full rounded-2xl shadow-xs transition-all",
              dragOver
                ? "border-primary border-2 border-dotted"
                : "border border-solid",
            )}
            initial={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0.8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <MultimodalInput
              input={input}
              setInput={setInput}
              onPaste={onPaste}
              onSubmit={onSubmit}
              contentBlocks={contentBlocks}
              onRemoveBlock={onRemoveBlock}
              onFileChange={onFileChange}
              isLoading={isLoading}
              onStop={onStop}
            />
          </motion.div>
        </div>
      </motion.div>
      <motion.div 
        className="flex-1"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className={contentClassName}>{/* Reserved area for additional content (divs/links) */}</div>
      </motion.div>
    </motion.div>
  );
}
