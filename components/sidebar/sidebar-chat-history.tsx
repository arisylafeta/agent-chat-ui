'use client';

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useRouter, usePathname } from "next/navigation";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "../ui/empty";
import { MessageSquare, Trash2 } from "lucide-react";
import { useChatSidebar, SidebarThread } from "@/hooks/use-chat-sidebar";
import { useState } from "react";
import { toast } from "sonner";

function ThreadHistoryLoading() {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function ThreadList({
  threads,
  onThreadClick,
  onThreadDelete,
}: {
  threads: SidebarThread[];
  onThreadClick?: (threadId: string) => void;
  onThreadDelete: (threadId: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (threads.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyTitle>No conversations yet</EmptyTitle>
            <EmptyDescription>
              Start a new chat to see your conversation history here
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    setDeletingId(threadId);
    
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }

      toast.success('Conversation deleted');
      onThreadDelete(threadId);
      
      // If we're on the deleted thread's page, redirect to home
      if (pathname === `/chat/${threadId}`) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-1 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((thread) => {
        // Get thread name from name field or metadata
        const threadName = thread.name || 
          (thread.metadata_json?.name) || 
          thread.thread_id;
        
        const isActive = pathname === `/chat/${thread.thread_id}`;

        return (
          <div
            key={thread.thread_id}
            className="group relative w-full"
          >
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start text-left font-normal py-2 px-3"
              onClick={() => {
                if (onThreadClick) {
                  onThreadClick(thread.thread_id);
                } else {
                  router.push(`/chat/${thread.thread_id}`);
                }
              }}
            >
              <div className="flex-1 truncate pr-6 text-sm">
                {threadName}
              </div>
            </Button>
            
            <button
              onClick={(e) => handleDelete(e, thread.thread_id)}
              disabled={deletingId === thread.thread_id}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function SidebarChatHistory({
  onThreadClick,
}: {
  onThreadClick?: (threadId: string) => void;
}) {
  const { threads, threadsLoading, refetchThreads } = useChatSidebar();

  if (threadsLoading) {
    return <ThreadHistoryLoading />;
  }

  return (
    <ThreadList
      threads={threads}
      onThreadClick={onThreadClick}
      onThreadDelete={refetchThreads}
    />
  );
}
