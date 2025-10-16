import { useCallback, useMemo, useState, useEffect } from "react";
import { useMediaQuery } from "./use-media-queries";
import { useSidebar } from "@/providers/Sidebar";

const SIDEBAR_WIDTH_PX = 256;

export interface SidebarThread {
  thread_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  metadata_json: any;
}

export function useChatSidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  
  // Thread management state
  const [threads, setThreads] = useState<SidebarThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [threadsFetched, setThreadsFetched] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, [setSidebarOpen]);

  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    setThreadsError(null);
    
    try {
      const response = await fetch('/api/threads');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - this is okay, just show empty state
          setThreads([]);
          setThreadsFetched(true);
          return;
        }
        throw new Error(`Failed to fetch threads: ${response.statusText}`);
      }
      
      const data = await response.json();
      setThreads(data.threads || []);
      setThreadsFetched(true);
    } catch (err) {
      console.error('[useChatSidebar] Error fetching threads:', err);
      setThreadsError(err instanceof Error ? err.message : 'Failed to fetch threads');
      setThreads([]);
      setThreadsFetched(true);
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  // Fetch threads only when sidebar is opened for the first time
  useEffect(() => {
    if (sidebarOpen && !threadsFetched) {
      fetchThreads();
    }
  }, [sidebarOpen, threadsFetched, fetchThreads]);

  // Computed styles for sidebar animation
  const sidebarMotionProps = useMemo(() => ({
    className: "shadow-inner-right hidden h-screen shrink-0 bg-secondary md:flex absolute z-20 overflow-hidden border-r bg-secondary",
    style: { width: SIDEBAR_WIDTH_PX },
    animate: {
      x: sidebarOpen ? 0 : -SIDEBAR_WIDTH_PX,
    },
    initial: { x: -SIDEBAR_WIDTH_PX },
    transition: { duration: 0.2, ease: "linear" as const },
  }), [sidebarOpen]);

  // Computed styles for main content area
  const contentMotionProps = useMemo(() => ({
    animate: {
      marginLeft: sidebarOpen ? (isLargeScreen ? SIDEBAR_WIDTH_PX : 0) : 0,
      width: sidebarOpen
        ? isLargeScreen
          ? `calc(100% - ${SIDEBAR_WIDTH_PX}px)`
          : "100%"
        : "100%",
    },
    transition: { duration: 0.2, ease: "linear" as const },
  }), [sidebarOpen, isLargeScreen]);

  return {
    chatHistoryOpen: sidebarOpen,
    setChatHistoryOpen: setSidebarOpen,
    toggleSidebar,
    isLargeScreen,
    sidebarMotionProps,
    contentMotionProps,
    SIDEBAR_WIDTH_PX,
    // Thread management
    threads,
    threadsLoading,
    threadsError,
    refetchThreads: fetchThreads,
  };
}
