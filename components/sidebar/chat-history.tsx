"use client";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useThreads } from "../../providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";
import { useQueryState } from "nuqs";
import { getContentString } from "../../lib/utils";
import { ThreadActions } from "./thread-actions";


function ThreadList({
  threads,
  onThreadClick,
  onThreadUpdate,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
  onThreadUpdate: () => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        // Priority: 1. name field, 2. metadata.name, 3. first message, 4. thread_id
        let itemText = t.thread_id;
        
        // Check if thread has name field (from database)
        if ((t as any).name && typeof (t as any).name === 'string') {
          itemText = (t as any).name;
        }
        // Fallback to metadata name
        else if (t.metadata?.name && typeof t.metadata.name === 'string') {
          itemText = t.metadata.name;
        }
        // Fallback to first message
        else if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        
        // Check is_public from both database field and metadata
        const isPublic = (t as any).is_public === true || t.metadata?.is_public === true;
        const threadName = (t as any).name || (t.metadata?.name && typeof t.metadata.name === 'string' ? t.metadata.name : undefined);
        
        return (
          <div key={t.thread_id} className="w-full px-1 group">
            <div className="flex items-center gap-1 w-full">
              <Button
                variant="ghost"
                className="flex-1 items-start justify-start text-left font-normal text-xs leading-tight py-1.5 h-auto px-2"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('[ChatHistory] Thread clicked:', t.thread_id, 'Current threadId:', threadId);
                  onThreadClick?.(t.thread_id);
                  if (t.thread_id === threadId) return;
                  console.log('[ChatHistory] Setting threadId to:', t.thread_id);
                  setThreadId(t.thread_id);
                }}
              >
                <p className="truncate text-ellipsis text-xs">{itemText}</p>
              </Button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ThreadActions
                  threadId={t.thread_id}
                  threadName={threadName}
                  isPublic={isPublic}
                  onUpdate={onThreadUpdate}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="h-6 w-full" />
      ))}
    </div>
  );
}

export default function ChatHistory({
  onThreadClick,
}: {
  onThreadClick?: (threadId: string) => void;
}) {
  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  const handleThreadUpdate = () => {
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    handleThreadUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (threadsLoading) {
    return <ThreadHistoryLoading />;
  }

  return (
    <ThreadList
      threads={threads}
      onThreadClick={onThreadClick}
      onThreadUpdate={handleThreadUpdate}
    />
  );
}
