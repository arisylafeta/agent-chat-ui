"use client";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useThreads } from "../../providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current threadId from pathname (/[threadId])
  // Root path (/) is null, otherwise it's the last segment
  const currentThreadId = pathname === '/' ? null : pathname?.split('/').pop();

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        
        // Use metadata name if available
        if (t.metadata?.name && typeof t.metadata.name === 'string') {
          itemText = t.metadata.name;
        } else if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        
        const isPublic = t.metadata?.is_public === true;
        const threadName = (t.metadata?.name && typeof t.metadata.name === 'string') ? t.metadata.name : undefined;
        
        return (
          <div key={t.thread_id} className="w-full px-1 group">
            <div className="flex items-center gap-1 w-full">
              <Button
                variant="ghost"
                className="flex-1 items-start justify-start text-left font-normal text-xs leading-tight py-1.5 h-auto px-2"
                onClick={(e) => {
                  e.preventDefault();
                  onThreadClick?.(t.thread_id);
                  // Don't navigate if already on this thread
                  if (t.thread_id === currentThreadId) return;
                  // Navigate to the thread route
                  router.push(`/${t.thread_id}`);
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
