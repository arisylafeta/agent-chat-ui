"use client";

import React, { useEffect } from "react";
import { ThreadProvider, useThreads } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/artifact/artifact";
import { Toaster } from "@/components/ui/sonner";
import ChatSidebar from "@/components/sidebar/app-sidebar";
import { useChatSidebar } from "@/hooks/use-chat-sidebar";

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const { getThreads, setThreads, setThreadsLoading } = useThreads();
  const {
    chatHistoryOpen,
    toggleSidebar,
    isLargeScreen,
    sidebarMotionProps,
    SIDEBAR_WIDTH_PX,
  } = useChatSidebar();

  // Fetch threads once when layout mounts
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar at layout level - persists across navigation, outside StreamProvider */}
      <ChatSidebar
        chatHistoryOpen={chatHistoryOpen}
        toggleSidebar={toggleSidebar}
        isLargeScreen={isLargeScreen}
        sidebarMotionProps={sidebarMotionProps}
        SIDEBAR_WIDTH_PX={SIDEBAR_WIDTH_PX}
      />
      {/* Content area with proper width adjustment */}
      <div 
        style={{
          marginLeft: chatHistoryOpen && isLargeScreen ? SIDEBAR_WIDTH_PX : 0,
          width: chatHistoryOpen && isLargeScreen ? `calc(100% - ${SIDEBAR_WIDTH_PX}px)` : '100%',
          transition: 'margin-left 0.2s linear, width 0.2s linear',
        }}
        className="flex-1"
      >
        {/* StreamProvider wraps only the content area, not the sidebar */}
        <StreamProvider>
          <ArtifactProvider>
            {children}
          </ArtifactProvider>
        </StreamProvider>
      </div>
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Toaster />
      <ThreadProvider>
        <ChatLayoutContent>{children}</ChatLayoutContent>
      </ThreadProvider>
    </>
  );
}
