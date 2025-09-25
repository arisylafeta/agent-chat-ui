"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";

export function MarkdownText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("text-left break-words", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <span className="inline">{children}</span>,
          // Prevent line breaks from creating new paragraphs
          br: () => <span> </span>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
