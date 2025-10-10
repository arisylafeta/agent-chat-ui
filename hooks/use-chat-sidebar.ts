import { useCallback, useMemo } from "react";
import { useMediaQuery } from "./use-media-queries";
import { useThreads } from "@/providers/Thread";

const SIDEBAR_WIDTH_PX = 256;

export function useChatSidebar() {
  const { chatHistoryOpen, setChatHistoryOpen } = useThreads();
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const toggleSidebar = useCallback(() => {
    setChatHistoryOpen((prev) => !prev);
  }, [setChatHistoryOpen]);

  // Computed styles for sidebar animation
  const sidebarMotionProps = useMemo(() => ({
    className: "shadow-inner-right hidden h-screen shrink-0 bg-secondary md:flex absolute z-20 overflow-hidden border-r bg-secondary",
    style: { width: SIDEBAR_WIDTH_PX },
    animate: {
      x: chatHistoryOpen ? 0 : -SIDEBAR_WIDTH_PX,
    },
    initial: { x: -SIDEBAR_WIDTH_PX },
    transition: { duration: 0.2, ease: "linear" as const },
  }), [chatHistoryOpen]);

  // Computed styles for main content area
  const contentMotionProps = useMemo(() => ({
    animate: {
      marginLeft: chatHistoryOpen ? (isLargeScreen ? SIDEBAR_WIDTH_PX : 0) : 0,
      width: chatHistoryOpen
        ? isLargeScreen
          ? `calc(100% - ${SIDEBAR_WIDTH_PX}px)`
          : "100%"
        : "100%",
    },
    transition: { duration: 0.2, ease: "linear" as const },
  }), [chatHistoryOpen, isLargeScreen]);

  return {
    chatHistoryOpen,
    setChatHistoryOpen,
    toggleSidebar,
    isLargeScreen,
    sidebarMotionProps,
    contentMotionProps,
    SIDEBAR_WIDTH_PX,
  };
}
