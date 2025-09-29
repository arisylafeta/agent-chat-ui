import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { ensureToolCallsHaveResponses } from "../lib/ensure-tool-responses";
import { useStreamContext } from "../providers/Stream";

type StreamContextValue = ReturnType<typeof useStreamContext>;

type ArtifactContext = Record<string, unknown>;

interface UseChatSubmissionOptions {
  stream: StreamContextValue;
  artifactContext: ArtifactContext;
  contentBlocks: Base64ContentBlock[];
  setContentBlocks: React.Dispatch<React.SetStateAction<Base64ContentBlock[]>>;
}

interface UseChatSubmissionResult {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  firstTokenReceived: boolean;
  handleSubmit: (event: FormEvent) => void;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}

export function useChatSubmission({
  stream,
  artifactContext,
  contentBlocks,
  setContentBlocks,
}: UseChatSubmissionOptions): UseChatSubmissionResult {
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const prevMessageLength = useRef(0);

  useEffect(() => {
    const { messages } = stream;
    if (
      messages.length !== prevMessageLength.current &&
      messages.length > 0 &&
      messages[messages.length - 1]?.type === "ai"
    ) {
      setFirstTokenReceived(true);
    }
    prevMessageLength.current = messages.length;
  }, [stream]);

  const context = useMemo(() => {
    return Object.keys(artifactContext).length > 0 ? artifactContext : undefined;
  }, [artifactContext]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();

      if ((input.trim().length === 0 && contentBlocks.length === 0) || stream.isLoading) {
        return;
      }

      setFirstTokenReceived(false);

      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [
          ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
          ...contentBlocks,
        ] as Message["content"],
      };

      const toolMessages = ensureToolCallsHaveResponses(stream.messages);

      stream.submit(
        { messages: [...toolMessages, newHumanMessage], context },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
          optimisticValues: (prev) => ({
            ...prev,
            context,
            messages: [
              ...(prev.messages ?? []),
              ...toolMessages,
              newHumanMessage,
            ],
          }),
        },
      );

      setInput("");
      setContentBlocks([]);
    },
    [contentBlocks, context, input, setContentBlocks, stream],
  );

  const handleRegenerate = useCallback(
    (parentCheckpoint: Checkpoint | null | undefined) => {
      prevMessageLength.current = prevMessageLength.current - 1;
      setFirstTokenReceived(false);
      stream.submit(undefined, {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
      });
    },
    [stream],
  );

  return {
    input,
    setInput,
    firstTokenReceived,
    handleSubmit,
    handleRegenerate,
  };
}
