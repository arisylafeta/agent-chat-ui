"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Thread } from "@/components/chat/chat";
import { useThreads } from "@/providers/Thread";
import { toast } from "sonner";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Check if it's a thread not found error
    const message = error.message || '';
    const isThreadNotFound = 
      message.includes('404') || 
      message.toLowerCase().includes('thread') && message.toLowerCase().includes('not found');
    
    if (isThreadNotFound) {
      toast.info("Thread not found", {
        description: "Starting a new chat instead.",
        closeButton: true,
      });
      this.props.onError();
    } else {
      toast.error("An error occurred", {
        description: "Redirecting to home page.",
        closeButton: true,
      });
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function ChatPageContent({ threadId }: { threadId: string }) {
  const { setCurrentThreadId } = useThreads();
  const router = useRouter();

  // Set threadId in context when component mounts or threadId changes
  useEffect(() => {
    setCurrentThreadId(threadId);
  }, [threadId, setCurrentThreadId]);

  const handleError = () => {
    router.push('/');
  };

  return (
    <ErrorBoundary onError={handleError}>
      <Thread />
    </ErrorBoundary>
  );
}

export default function ChatPage(
  props: {
    params: Promise<{ threadId: string }>
  }
) {
  // use() hook unwraps the promise, so params is already resolved
  const params = use(props.params);

  return <ChatPageContent threadId={params.threadId} />;
}
