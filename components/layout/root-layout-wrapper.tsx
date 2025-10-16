'use client';

import React from 'react';
import ChatSidebar from '@/components/sidebar/app-sidebar';
import { useChatSidebar } from '@/hooks/use-chat-sidebar';
import { Toaster } from '@/components/ui/sonner';

export function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  const {
    chatHistoryOpen,
    toggleSidebar,
    isLargeScreen,
    sidebarMotionProps,
    SIDEBAR_WIDTH_PX,
  } = useChatSidebar();

  return (
    <>
      <Toaster />
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar - available on all pages */}
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
          className="flex-1 overflow-hidden"
        >
          {children}
        </div>
      </div>
    </>
  );
}
