import { useEffect, useRef } from "react";
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


function ScrollToBottom() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
      <Button
        variant="outline"
        size="sm"
        className="shadow-lg animate-in fade-in-0 zoom-in-95"
        onClick={() => scrollToBottom()}
      >
        <ArrowDown className="h-4 w-4" />
        <span className="sr-only">Scroll to bottom</span>
      </Button>
    </div>
  );
}

export function Thread() {
  const {
    artifactContext,
    setArtifactContext,
    artifactOpen,
    closeArtifact,
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
            isOverlayLayout={artifactOpen}
            isLargeScreen={isLargeScreen}
            chatHistoryOpen={chatHistoryOpen}
            onToggleSidebar={toggleSidebar}
            onNewThread={() => setThreadId(null)}
            opened={chatHistoryOpen}
          />

          <StickToBottom className="relative flex-1 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain",
                artifactOpen ? "md:pr-[420px]" : "px-4",
                !chatStarted && "mt-[25vh] flex flex-col items-stretch",
              )}
            >
              <div
                className={cn(
                  "pt-6 pb-8 flex flex-col gap-4 w-full min-w-0",
                  artifactOpen ? "px-4 md:max-w-[400px]" : "max-w-3xl mx-auto",
                )}
              >
                <Messages
                  messages={messages}
                  isLoading={isLoading}
                  firstTokenReceived={firstTokenReceived}
                  hasNoAIOrToolMessages={hasNoAIOrToolMessages}
                  streamInterrupt={stream.interrupt}
                  handleRegenerate={handleRegenerate}
                />
              </div>
            </div>
            <ScrollToBottom />
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
              artifactOpen ? "px-4 md:max-w-[400px]" : "max-w-3xl mx-auto",
            )}
          >
            <div
              ref={dropRef}
              className={cn(
                "bg-background relative z-10 mb-8 w-full rounded-2xl shadow-xs transition-all",
                dragOver
                  ? "border-primary border-2 border-dashed"
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
          blankBackground={false}
        />
      </div>
    </div>
  );
}
