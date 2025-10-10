"use client";

import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { ShareHeader } from "./share-header";
import { LoginDialog } from "./login-dialog";
import { Messages } from "@/components/messages/messages";
import { ArtifactSidebar } from "@/components/artifact/artifact-sidebar";
import { MultimodalInput } from "@/components/chat/multimodal-input";
import { StickToBottom } from "use-stick-to-bottom";
import { cn } from "@/lib/utils";
import { useChatArtifact } from "@/hooks/use-chat-artifact";
import { useStreamContext } from "@/providers/Stream";

interface ShareThreadViewProps {
  threadId: string;
  threadName: string;
}

export function ShareThreadView({ threadId, threadName }: ShareThreadViewProps) {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [_threadIdQuery, setThreadIdQuery] = useQueryState("threadId");
  const stream = useStreamContext();

  // Set threadId in URL query for StreamProvider
  useEffect(() => {
    setThreadIdQuery(threadId);
  }, [threadId, setThreadIdQuery]);
  
  const {
    artifactOpen,
    closeArtifact,
  } = useChatArtifact();

  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool"
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <ShareHeader 
        threadName={threadName}
        onLogin={() => setLoginDialogOpen(true)}
        artifactOpen={artifactOpen}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <StickToBottom className="relative flex-1 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain",
                artifactOpen ? "md:pr-[420px]" : "px-4",
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
                  firstTokenReceived={false}
                  hasNoAIOrToolMessages={hasNoAIOrToolMessages}
                  streamInterrupt={stream.interrupt}
                  handleRegenerate={() => {
                    // Regenerate requires login
                    setLoginDialogOpen(true);
                  }}
                />
              </div>
            </div>
          </StickToBottom>

          {/* Input area - shows login dialog on click */}
          <div
            className={cn(
              "flex flex-col items-center gap-8 bg-background w-full min-w-0 overflow-x-hidden px-3 sm:px-4",
              artifactOpen ? "px-4 md:max-w-[400px]" : "max-w-3xl mx-auto",
            )}
          >
            <div
              onClick={() => setLoginDialogOpen(true)}
              className={cn(
                "bg-background relative z-10 mb-8 w-full rounded-2xl shadow-xs transition-all cursor-pointer",
                "border border-solid",
              )}
            >
              {/* Overlay to capture clicks */}
              <div className="absolute inset-0 z-10 rounded-2xl" />
              <MultimodalInput
                input=""
                setInput={() => {}}
                onPaste={(e) => e.preventDefault()}
                onSubmit={(e) => {
                  e.preventDefault();
                  setLoginDialogOpen(true);
                }}
                contentBlocks={[]}
                onRemoveBlock={() => {}}
                onFileChange={() => {}}
                isLoading={false}
                onStop={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Artifact sidebar */}
        {artifactOpen && (
          <ArtifactSidebar
            onClose={closeArtifact}
          />
        )}
      </div>

      {/* Login dialog */}
      <LoginDialog 
        open={loginDialogOpen} 
        onClose={() => setLoginDialogOpen(false)} 
      />
    </div>
  );
}
