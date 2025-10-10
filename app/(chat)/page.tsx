"use client";

import { Thread } from "@/components/chat/chat";
import React, { useEffect } from "react";
import { useThreads } from "@/providers/Thread";

export default function ChatHomePage(): React.ReactNode {
  const { setCurrentThreadId } = useThreads();

  // Clear threadId when on home page
  useEffect(() => {
    setCurrentThreadId(null);
  }, [setCurrentThreadId]);

  return <Thread />;
}
