'use client';
import { Thread } from "@langchain/langgraph-sdk";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    try {
      // Call custom API endpoint that queries Supabase threads table
      // This bypasses LangGraph's in-memory storage and includes public threads
      const response = await fetch('/api/threads');
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('[ThreadProvider] User not authenticated');
          return [];
        }
        console.error('[ThreadProvider] API error:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      // Transform Supabase threads to LangGraph Thread format
      const threads: Thread[] = (data.threads || []).map((t: any) => ({
        thread_id: t.thread_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        metadata: {
          name: t.name,
          is_public: t.is_public,
          owner_id: t.owner_id,
        },
        values: {}, // Will be populated when thread is loaded
      }));
      
      return threads;
    } catch (error) {
      console.error('[ThreadProvider] Failed to fetch threads:', error);
      return [];
    }
  }, []);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
