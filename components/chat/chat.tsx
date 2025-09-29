import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/chat-header";
import { MultimodalInput } from "./multimodal-input";
import { ArrowDown } from "lucide-react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Messages } from "@/components/messages/messages";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ArtifactSidebar } from "@/components/artifact/artifact-sidebar";
import Suggested from "./suggested";
import { useChatArtifact } from "@/hooks/use-chat-artifact";
import { useChatSubmission } from "@/hooks/use-chat-submission";
import { useChatSidebar } from "@/hooks/use-chat-sidebar";
import { useQueryState } from "nuqs";
import ChatSidebar from "@/components/sidebar/app-sidebar";


function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      id="chat-scroll"
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%", overflowAnchor: "none" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function Thread() {
  const {
    artifactContext,
    setArtifactContext,
    artifactOpen,
    closeArtifact,
    artifactOpenForLayout,
    blankArtifactBackground,
    onArtifactClose,
  } = useChatArtifact();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const {
    chatHistoryOpen,
    toggleSidebar,
    isLargeScreen,
    sidebarMotionProps,
    contentMotionProps,
    SIDEBAR_WIDTH_PX,
  } = useChatSidebar();
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks: _resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const stream = useStreamContext();
  const {
    input,
    setInput,
    firstTokenReceived,
    handleSubmit,
    handleRegenerate,
  } = useChatSubmission({
    stream,
    artifactContext,
    contentBlocks,
    setContentBlocks,
  });

  // Alias for readability in layout decisions
  const isOverlayLayout = artifactOpenForLayout;

  // Common class tokens (reduces duplication)
  const SCROLL_BASE = "absolute inset-0 min-w-0 overflow-x-hidden overflow-y-scroll touch-pan-y overscroll-behavior-contain -webkit-overflow-scrolling-touch no-scrollbar scrollbar-none";
  const CONTENT_BASE = "pt-6 pb-8 flex flex-col gap-4 w-full min-w-0 overflow-x-hidden";
  const CONTENT_OPEN = "px-4 md:max-w-[400px]";
  const CONTENT_CLOSED = "max-w-3xl mx-auto";
  const SCROLL_PADDING_RIGHT_OPEN = "md:pr-[420px]";

  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  const setThreadId = (id: string | null) => {
    _setThreadId(id);

    // close artifact and reset artifact context
    closeArtifact();
    setArtifactContext({});
  };

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
        <ChatSidebar 
          chatHistoryOpen={chatHistoryOpen}
          toggleSidebar={toggleSidebar}
          isLargeScreen={isLargeScreen}
          sidebarMotionProps={sidebarMotionProps}
          SIDEBAR_WIDTH_PX={SIDEBAR_WIDTH_PX}
        />

      <div className={cn("grid w-full grid-cols-[1fr_0fr] transition-all duration-500")}
      >
        <motion.div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden",
            !chatStarted && "grid-rows-[1fr]",
          )}
          layout={isLargeScreen}
          {...contentMotionProps}
        >
          <ChatHeader
            chatStarted={chatStarted}
            isOverlayLayout={artifactOpenForLayout}
            isLargeScreen={isLargeScreen}
            chatHistoryOpen={chatHistoryOpen}
            onToggleSidebar={toggleSidebar}
            onNewThread={() => setThreadId(null)}
            opened={chatHistoryOpen}
          />

          <StickToBottom className="relative flex-1 overflow-hidden no-scrollbar">
            <StickyToBottomContent
              className={cn(
                SCROLL_BASE,
                isOverlayLayout ? undefined : "px-4",
                isOverlayLayout && SCROLL_PADDING_RIGHT_OPEN,
                !chatStarted && "mt-[25vh] flex flex-col items-stretch",
              )}
              contentClassName={cn(
                CONTENT_BASE,
                isOverlayLayout ? CONTENT_OPEN : CONTENT_CLOSED,
              )}
              content={
                <Messages
                  messages={messages}
                  isLoading={isLoading}
                  firstTokenReceived={firstTokenReceived}
                  hasNoAIOrToolMessages={hasNoAIOrToolMessages}
                  streamInterrupt={stream.interrupt}
                  handleRegenerate={handleRegenerate}
                />
              }
            />
              <div className="absolute bottom-4 left-0 right-0 pointer-events-none">
                  <div className={cn(isOverlayLayout ? CONTENT_OPEN : CONTENT_CLOSED)}>
                    <div className="flex justify-center pointer-events-auto">
                      <ScrollToBottom className="animate-in fade-in-0 zoom-in-95" />
                    </div>
                  </div>
                </div>
          </StickToBottom>

          <div className="absolute inset-0 m-auto md:px-10 px-3 flex items-center justify-center pointer-events-none">
            {!chatStarted && (
              <Suggested/>
            )}
          </div>
          {/* Static bottom input panel (outside scroll container) */}
          <div
            className={cn(
              "flex flex-col items-center gap-8 bg-background w-full min-w-0 overflow-x-hidden px-3 sm:px-4",
              isOverlayLayout ? CONTENT_OPEN : "",
            )}
          >
            <div
              ref={dropRef}
              className={cn(
                "bg-background relative z-10 mb-8 w-full rounded-2xl shadow-xs transition-all",
                isOverlayLayout ? undefined : CONTENT_CLOSED,
                dragOver
                  ? "border-primary border-2 border-dotted"
                  : "border border-solid",
              )}
            >
              <MultimodalInput
                input={input}
                setInput={setInput}
                onPaste={handlePaste}
                onSubmit={handleSubmit}
                contentBlocks={contentBlocks}
                onRemoveBlock={removeBlock}
                onFileChange={handleFileUpload}
                isLoading={isLoading}
                onStop={() => stream.stop()}
              />
            </div>
          </div>
        </motion.div>

        {/* Artifact Sidebar */}
        <ArtifactSidebar
          onClose={() => onArtifactClose({ wait: 150 })}
          open={artifactOpen}
          isSidebarOpen={chatHistoryOpen}
          blankBackground={blankArtifactBackground}
        />
      </div>
    </div>
  );
}
