import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

// Map tool names to human-readable thinking phases
function getThinkingPhase(toolName: string): string {
  const phaseMap: Record<string, string> = {
    search: "Searching for your results...",
    search_product_image_online: "Searching for visual matches...",
    search_product_online: "Searching online stores...",
    get_recommendations: "Finding recommendations for you...",
  };
  
  return phaseMap[toolName] || "Processing your request now...";
}

// Render cleaned up tool call content based on tool type
function renderToolCallContent(toolName: string, args: Record<string, any>) {
  // For text-based shopping search, show query
  if (toolName === "search_product_online" && args.query) {
    return (
      <p className="text-xs text-gray-400 italic">
        Query: {args.query}
      </p>
    );
  }
  
  // For image-based search, show cleaner message
  if (toolName === "search_product_image_online") {
    const query = args.prompt || "uploaded image";
    return (
      <p className="text-xs text-gray-400 italic">
        Searching with image of {query}
      </p>
    );
  }
  
  // For other search tools, show query if available
  if (toolName.includes("search") && args.query) {
    return (
      <p className="text-xs text-gray-400 italic">
        Query: {args.query}
      </p>
    );
  }
  
  // For other tools, show a minimal representation
  const relevantKeys = Object.keys(args).filter(
    key => !key.includes("id") && !key.includes("metadata")
  );
  
  if (relevantKeys.length === 0) return null;
  
  return (
    <div className="text-xs text-gray-400 space-y-1">
      {relevantKeys.slice(0, 2).map((key) => (
        <p key={key} className="italic">
          {key}: {String(args[key]).slice(0, 100)}{String(args[key]).length > 100 ? "..." : ""}
        </p>
      ))}
    </div>
  );
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        const isExpanded = expandedIndex === idx;
        
        return (
          <div
            key={idx}
            className="overflow-hidden bg-transparent"
          >
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              className="w-full text-left px-2 py-1 flex items-center justify-between hover:bg-gray-50/30 transition-colors rounded"
            >
              <div className="flex-1">
                <h3 className="text-gray-500 text-xs italic">
                  {getThinkingPhase(tc.name)}
                </h3>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pb-2">
                    <div className="pt-1">
                      {renderToolCallContent(tc.name, args)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Get human-readable result phase
function getResultPhase(toolName: string): string {
  const phaseMap: Record<string, string> = {
    search: "Found results for you",
    search_product_image_online: "Found visual matches",
    search_product_online: "Found products online",
    get_recommendations: "Recommendations ready for you",
  };
  
  return phaseMap[toolName] || "Processing complete for you";
}

// Render search results as unordered list (titles only)
function renderSearchResults(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) return null;
  
  return (
    <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 italic">
      {items.map((item, idx) => {
        // Handle different item structures
        if (typeof item === "string") {
          return <li key={idx}>{item}</li>;
        }
        
        // Extract title only
        const title = item.title || item.name || item.label;
        
        if (title) {
          // Clean up the title - remove site names and extra info
          const cleanTitle = title
            .replace(/\s*[|\\-]\s*(Amazon\.com|Walmart|eBay|Poshmark|iHeartRaves|CLOTHBASE|Hipercalzado|Amazon\.com\.au).*$/i, '')
            .trim();
          
          return (
            <li key={idx} className="ml-2">
              {cleanTitle}
            </li>
          );
        }
        
        // Fallback: show first meaningful value
        const firstValue = Object.values(item).find(v => v && String(v).length > 0);
        return firstValue ? <li key={idx}>{String(firstValue).slice(0, 100)}</li> : null;
      })}
    </ul>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let parsedContent: any;
  let isJsonContent = false;
  let hasError = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
      // Check if the tool result contains an error
      hasError = !!parsedContent?.error;
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  const toolName = message.name || "";
  const isSearchTool = toolName.includes("search");

  return (
    <div className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2">
      <div className="overflow-hidden bg-transparent">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left px-2 py-1 flex items-center justify-between hover:bg-gray-50/30 transition-colors rounded"
        >
          <div className="flex-1">
            <h3 className={hasError ? "text-red-500 text-xs italic" : "text-gray-500 text-xs italic"}>
              {hasError ? "Search failed - retrying..." : getResultPhase(toolName)}
            </h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-400" />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-2 pb-2">
                <div className="pt-1">
                  {isSearchTool && Array.isArray(parsedContent) ? (
                    renderSearchResults(parsedContent)
                  ) : isSearchTool && parsedContent?.matches ? (
                    renderSearchResults(parsedContent.matches)
                  ) : isSearchTool && parsedContent?.results ? (
                    renderSearchResults(parsedContent.results)
                  ) : isSearchTool && parsedContent?.items ? (
                    renderSearchResults(parsedContent.items)
                  ) : isJsonContent && Array.isArray(parsedContent) ? (
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 italic">
                      {parsedContent.slice(0, isExpanded ? undefined : 5).map((item, idx) => (
                        <li key={idx} className="ml-2">
                          {typeof item === "string" ? item : JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      {String(message.content).slice(0, isExpanded ? undefined : 300)}
                      {!isExpanded && String(message.content).length > 300 ? "..." : ""}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
