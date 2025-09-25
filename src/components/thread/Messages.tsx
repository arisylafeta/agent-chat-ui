import React from "react";
import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";

export function Messages(props: {
  messages: Message[];
  isLoading: boolean;
  firstTokenReceived: boolean;
  hasNoAIOrToolMessages: boolean;
  streamInterrupt?: unknown;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const {
    messages,
    isLoading,
    firstTokenReceived,
    hasNoAIOrToolMessages,
    streamInterrupt,
    handleRegenerate,
  } = props;

  return (
    <>
      {messages
        .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
        .map((message, index) =>
          message.type === "human" ? (
            <HumanMessage
              key={message.id || `${message.type}-${index}`}
              message={message}
              isLoading={isLoading}
            />
          ) : (
            <AssistantMessage
              key={message.id || `${message.type}-${index}`}
              message={message}
              isLoading={isLoading}
              handleRegenerate={handleRegenerate}
            />
          ),
        )}

      {hasNoAIOrToolMessages && !!streamInterrupt && (
        <AssistantMessage
          key="interrupt-msg"
          message={undefined}
          isLoading={isLoading}
          handleRegenerate={handleRegenerate}
        />
      )}

      {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
    </>
  );
}
