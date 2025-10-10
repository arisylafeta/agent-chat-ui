'use client';
import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  isUIMessage,
  isRemoveUIMessage,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from "next/navigation";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
  authToken: string | null,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }
    
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    
    const res = await fetch(`${apiUrl}/info`, {
      headers,
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
  authToken,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
  authToken: string | null;
}) => {
  const { currentThreadId: threadId, setCurrentThreadId: setThreadId, getThreads, setThreads } = useThreads();
  const router = useRouter();
  const pathname = usePathname();

  const defaultHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    [authToken]
  );

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    fetchStateHistory: false,
    defaultHeaders,
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          const currentUi = Array.isArray(prev.ui) ? prev.ui : [];
          const ui = uiMessageReducer(currentUi, event);
          return { ...prev, ui };
        });
      }
    },
    onThreadId: (id) => {
      setThreadId(id);
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
      
      // Navigate to /[threadId] if we're on the home page and a new thread was created
      // Use replace to update URL without breaking the stream (same layout, providers persist)
      if (pathname === '/' && id) {
        router.replace(`/${id}`);
      }
    },
  });

  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey, authToken).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code> and
              your API key is correctly set (if connecting to a deployed graph).
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl, authToken]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2024";
  const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID || "agent";
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthToken(session?.access_token ?? null);
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthToken(session?.access_token ?? null);
        setIsAuthReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!isAuthReady) {
    return null; // Or a proper loading component if needed
  }

  return (
    <StreamSession
      apiKey={null}
      apiUrl={apiUrl}
      assistantId={assistantId}
      authToken={authToken}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
