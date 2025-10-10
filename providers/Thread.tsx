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
  currentThreadId: string | null;
  setCurrentThreadId: Dispatch<SetStateAction<string | null>>;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);

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
        status: t.status || 'idle',
        // Parse metadata_json from Supabase
        metadata: typeof t.metadata_json === 'string' 
          ? JSON.parse(t.metadata_json)
          : (t.metadata_json || {}),
        values: {}, // Will be populated when thread is loaded
        // Include name and is_public from database
        name: t.name,
        is_public: t.is_public,
      }));
      
      console.log(`[ThreadProvider] Loaded ${threads.length} threads`);
      
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
    currentThreadId,
    setCurrentThreadId,
    chatHistoryOpen,
    setChatHistoryOpen,
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
