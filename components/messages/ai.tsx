import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "../../providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../../lib/utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { Writer } from "../artifact/writer/writer";
import { LensResults } from "../artifact/lens-results";
import { cn } from "../../lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { isAgentInboxInterruptSchema } from "../../lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import { useArtifact } from "../artifact/artifact";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  // Normalize values.ui to an array to avoid runtime errors if a non-array shape is returned
  const uiList = Array.isArray(values.ui)
    ? values.ui
    : values.ui
      ? [values.ui as any]
      : [];
  const customComponents = uiList.filter(
    (ui) => ui?.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent, artifact }}
          components={{ writer: Writer, lens_results: LensResults }}
          fallback={<div className="text-sm text-gray-500">Loading…</div>}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

interface InterruptProps {
  interruptValue?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interruptValue,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  return (
    <>
      {isAgentInboxInterruptSchema(interruptValue) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
          <ThreadView interrupt={interruptValue} />
        )}
      {interruptValue &&
      !isAgentInboxInterruptSchema(interruptValue) &&
      (isLastMessage || hasNoAIOrToolMessages) ? (
        <GenericInterruptView interrupt={interruptValue} />
      ) : null}
    </>
  );
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false), // Show thinking process by default
  );

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";

  // Check if this message has custom UI artifacts
  const uiList = Array.isArray(thread.values.ui)
    ? thread.values.ui
    : thread.values.ui
      ? [thread.values.ui as any]
      : [];
  const hasArtifact = uiList.some(
    (ui) => ui?.metadata?.message_id === message?.id,
  );

  // Hide tool result messages when hideToolCalls is true
  if (isToolResult && hideToolCalls) {
    return null;
  }

  // Don't render AI messages with only tool calls (no content, no artifact) when hideToolCalls is true
  if (
    hideToolCalls &&
    hasToolCalls &&
    contentString.length === 0 &&
    !hasArtifact
  ) {
    return null;
  }

  return (
    <div className="group mr-auto flex items-start gap-2 md:gap-3">
      <div className="flex w-full flex-col gap-2 md:gap-4">
        {isToolResult ? (
          <>
            <ToolResult message={message} />
            <Interrupt
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            {/* No CommandBar for tool results - they're part of the thinking process */}
          </>
        ) : (
          <>
            {contentString.length > 0 && (
              <div className="px-0 py-0 text-left max-w-[85%] text-sm">
                <MarkdownText className="text-sm leading-relaxed">{contentString}</MarkdownText>
              </div>
            )}

            {!hideToolCalls && (
              <>
                {(hasToolCalls && toolCallsHaveContents && (
                  <ToolCalls toolCalls={message.tool_calls} />
                )) ||
                  (hasAnthropicToolCalls && (
                    <ToolCalls toolCalls={anthropicStreamedToolCalls} />
                  )) ||
                  (hasToolCalls && (
                    <ToolCalls toolCalls={message.tool_calls} />
                  ))}
              </>
            )}

            {message && (
              <CustomComponent
                message={message}
                thread={thread}
              />
            )}
            <Interrupt
              interruptValue={threadInterrupt?.value}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            {/* Only show CommandBar if there's actual content (not just tool calls) */}
            {contentString.length > 0 && (
              <div
                className={cn(
                  "mr-auto flex items-center gap-2 transition-opacity",
                  "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
                )}
              >
                <BranchSwitcher
                  branch={meta?.branch}
                  branchOptions={meta?.branchOptions}
                  onSelect={(branch) => thread.setBranch(branch)}
                  isLoading={isLoading}
                />
                <CommandBar
                  content={contentString}
                  isLoading={isLoading}
                  isAiMessage={true}
                  handleRegenerate={() => handleRegenerate(parentCheckpoint)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-2">
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
      </div>
    </div>
  );
}
