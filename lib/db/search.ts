"use server";

import { createClient } from "@/utils/supabase/server";

export interface SearchResult {
  thread_id: string;
  thread_name: string | null;
  message_text: string;
  message_role: "human" | "ai" | "unknown";
  message_timestamp: string;
  thread_created_at: string;
  checkpoint_version: string;
}

/**
 * Search through chat conversations using the searchable_messages materialized view
 * @param query - The search query string (sanitized on server)
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of search results
 */
export async function searchConversations(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  console.log("[Search] Starting search with query:", query);
  
  // Sanitize input - remove special characters that could cause issues
  const sanitizedQuery = query
    .trim()
    .replace(/[^\w\s.,!?'-]/g, " ")
    .substring(0, 200); // Limit query length

  console.log("[Search] Sanitized query:", sanitizedQuery);

  if (!sanitizedQuery || sanitizedQuery.length < 2) {
    console.log("[Search] Query too short, returning empty results");
    return [];
  }

  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[Search] Current user:", user?.id || "not authenticated");

  if (!user) {
    console.log("[Search] No authenticated user, returning empty results");
    return [];
  }

  try {
    // Search using ILIKE for case-insensitive pattern matching
    // Filter by user_id to only show user's own conversations
    console.log("[Search] Executing query with user_id:", user.id);
    
    const { data, error } = await supabase
      .from("searchable_messages")
      .select(
        `
        thread_id,
        thread_name,
        message_text,
        message_role,
        message_timestamp,
        thread_created_at,
        checkpoint_version
      `
      )
      .eq("user_id", user.id)
      .ilike("message_text", `%${sanitizedQuery}%`)
      .order("message_timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Search] Database error:", error);
      return [];
    }

    console.log("[Search] Found results:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("[Search] First result sample:", {
        thread_id: data[0].thread_id,
        snippet: data[0].message_text.substring(0, 50),
      });
    }

    return data || [];
  } catch (error) {
    console.error("[Search] Unexpected error:", error);
    return [];
  }
}

/**
 * Refresh the searchable_messages materialized view
 * This should be called periodically or after significant chat activity
 */
export async function refreshSearchIndex(): Promise<{ success: boolean }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("refresh_searchable_messages");

    if (error) {
      console.error("Failed to refresh search index:", error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error refreshing search index:", error);
    return { success: false };
  }
}
