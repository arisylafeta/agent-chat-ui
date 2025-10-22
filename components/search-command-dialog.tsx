"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Calendar } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchConversations, type SearchResult } from "@/lib/db/search";
import { formatDistanceToNow } from "date-fns";

interface SearchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommandDialog({
  open,
  onOpenChange,
}: SearchCommandDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Debounced search with abort controller to prevent race conditions
  React.useEffect(() => {
    console.log("[SearchDialog] Query changed:", query);

    if (!query || query.length < 2) {
      console.log("[SearchDialog] Query too short, clearing results");
      setResults([]);
      setIsSearching(false);
      return;
    }

    // Create abort controller for this search request
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const performSearch = async () => {
      console.log("[SearchDialog] Starting search after debounce");
      setIsSearching(true);
      try {
        const searchResults = await searchConversations(query, 10);

        // Check if this request was aborted before updating state
        if (!abortController.signal.aborted) {
          console.log("[SearchDialog] Received results:", searchResults.length);
          setResults(searchResults);
        }
      } catch (error) {
        // Don't update state if request was aborted
        if (!abortController.signal.aborted) {
          console.error("[SearchDialog] Search failed:", error);
          setResults([]);
        }
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    timeoutId = setTimeout(performSearch, 300); // 300ms debounce

    // Cleanup: abort in-flight requests and clear timeout
    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [query]);

  const handleSelect = (threadId: string) => {
    onOpenChange(false);
    setQuery("");
    setResults([]);
    router.push(`/chat/${threadId}`);
  };

  // Extract a snippet from the message text (first 100 chars)
  const getSnippet = (text: string, maxLength: number = 80): string => {
    // Aggressively clean for UI display
    const cleaned = text
      .replace(/\\/g, "") // Remove backslashes
      .replace(/Message/gi, "") // Remove "Message" keyword
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "") // Remove UUIDs
      .replace(/[a-f0-9-]{10,}/gi, "") // Remove long hex patterns
      .replace(/https?:\/\/[^\s]+/gi, "") // Remove URLs
      .replace(/www\.[^\s]+/gi, "") // Remove www URLs
      .replace(/\.(com|co|net|org|au|uk)[^\s]*/gi, "") // Remove domain patterns
      .replace(/[a-z0-9]{20,}/gi, "") // Remove long alphanumeric strings
      .replace(/\b[a-f0-9]{3,8}\b/gi, "") // Remove short hex patterns
      .replace(/uploaded|isUrl|white|background|storage|object|public|supabase/gi, "") // Remove technical terms
      .replace(/[^a-zA-Z0-9 .,!?'-]/g, " ") // Keep only readable chars
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Extract first meaningful sentence or phrase
    const sentences = cleaned.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim() || cleaned;
    
    if (firstSentence.length <= maxLength) return firstSentence;
    return firstSentence.substring(0, maxLength).trim() + "...";
  };

  // Format the thread name or generate a default one
  const getThreadTitle = (result: SearchResult): string => {
    if (result.thread_name && result.thread_name.trim()) {
      return result.thread_name;
    }
    // Generate title from first message snippet
    const snippet = getSnippet(result.message_text, 50);
    return snippet || "Untitled conversation";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Search Conversations</DialogTitle>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search conversations..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[400px]">
        {isSearching && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        {!isSearching && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>No conversations found.</CommandEmpty>
        )}
        {!isSearching && results.length > 0 && (
          <CommandGroup heading="Conversations">
            {results.map((result, index) => {
              const title = getThreadTitle(result);
              const snippet = getSnippet(result.message_text, 80);
              const timestamp = formatDistanceToNow(
                new Date(result.message_timestamp),
                { addSuffix: true }
              );

              return (
                <CommandItem
                  key={`${result.thread_id}-${result.checkpoint_version}-${index}`}
                  value={`${result.thread_id}-${index}`}
                  onSelect={() => handleSelect(result.thread_id)}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-semibold truncate">{title}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Calendar className="size-3" />
                      <span>{timestamp}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
                    {snippet}
                  </p>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
