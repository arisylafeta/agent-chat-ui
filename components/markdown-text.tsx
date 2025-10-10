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
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-2">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-semibold mt-2 mb-1">{children}</h5>,
          h6: ({ children }) => <h6 className="text-sm font-semibold mt-2 mb-1">{children}</h6>,
          
          // Paragraphs
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          
          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-4">{children}</li>,
          
          // Code
          code: ({ inline, children, ...props }: any) => 
            inline ? (
              <code className="bg-gray-soft px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-gray-soft p-3 rounded-md text-sm font-mono overflow-x-auto mb-4" {...props}>
                {children}
              </code>
            ),
          pre: ({ children }) => <pre className="mb-4">{children}</pre>,
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent-2 pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          
          // Links
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent-2 hover:underline"
            >
              {children}
            </a>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-soft">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
          th: ({ children }) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
          
          // Horizontal rule
          hr: () => <hr className="my-6 border-t border-gray-300" />,
          
          // Strong/Bold
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          
          // Emphasis/Italic
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
