"use client";

import React from "react";
import { useStreamContext as useReactUIStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { MarkdownText } from "../../markdown-text";

type WriterProps = {
  title?: string;
  content?: string;
  description?: string;
};

export function Writer(props: WriterProps) {
  // Access meta passed via LoadExternalComponent (we pass { artifact } from the host UI)
  const { meta } = useReactUIStreamContext();
  const artifactTuple = (meta as any)?.artifact ?? null;

  let ArtifactComp: any = null;
  let bag: any = null;
  if (Array.isArray(artifactTuple)) {
    [ArtifactComp, bag] = artifactTuple;
  }

  const setOpen = bag?.setOpen ?? (() => {});
  const isOpen = !!bag?.open;
  const previewText = (props.content ?? "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 220);

  return (
    <>
      <div
        onClick={() => setOpen((o: boolean) => !o)}
        className={cn(
          "group w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300",
          isOpen ? "p-3 md:p-3 rounded-xl shadow-xs hover:shadow-xs" : "p-5 md:p-6 hover:bg-gray-50 hover:shadow-md",
        )}
        role="button"
        aria-label="Open essay artifact"
      >
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-semibold tracking-tight text-gray-900 truncate",
              isOpen ? "text-base md:text-sm" : "text-xl md:text-2xl",
            )}>
              {props.title ?? "Essay"}
            </h3>
          </div>
          <ChevronRight
            aria-hidden
            className={cn(
              "h-5 w-5 text-gray-400 transition-transform shrink-0",
              isOpen ? "opacity-60" : "group-hover:translate-x-0.5",
            )}
          />
        </div>
        {!isOpen && (
          <>
            {previewText ? (
              <p className="mt-3 text-sm leading-6 text-gray-600 max-h-20 overflow-hidden">
                {previewText}
                {((props.content ?? "").length ?? 0) > previewText.length ? "…" : ""}
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Click to open essay…</p>
            )}
            {props.description ? (
              <p className="mt-3 text-xs text-gray-500">{props.description}</p>
            ) : null}
          </>
        )}
      </div>

      {ArtifactComp ? (
        <ArtifactComp title={props.title ?? "Essay"}>
          <div className="p-6 md:p-8">
            <MarkdownText>{props.content ?? "Generating..."}</MarkdownText>
          </div>
        </ArtifactComp>
      ) : null}
    </>
  );
}
