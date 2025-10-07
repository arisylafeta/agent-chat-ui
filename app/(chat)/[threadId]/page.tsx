"use client";

import { Thread } from "@/components/chat/chat";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/artifact/artifact";
import { Toaster } from "@/components/ui/sonner";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ThreadPage({ params }: { params: { threadId: string } }): React.ReactNode {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Validate thread exists and user has access
    const validateThread = async () => {
      try {
        const response = await fetch(`/api/threads/validate/${params.threadId}`);
        
        if (!response.ok) {
          // Thread doesn't exist or user doesn't have access
          console.log(`[ThreadPage] Thread ${params.threadId} not found, redirecting to home`);
          router.replace('/');
          return;
        }
        
        const data = await response.json();
        if (!data.exists) {
          router.replace('/');
          return;
        }
        
        setIsValid(true);
      } catch (error) {
        console.error('[ThreadPage] Error validating thread:', error);
        router.replace('/');
      } finally {
        setIsValidating(false);
      }
    };

    validateThread();
  }, [params.threadId, router]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-gray-500">Loading thread...</div>
      </div>
    );
  }

  if (!isValid) {
    return null; // Will redirect
  }

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider threadId={params.threadId}>
          <ArtifactProvider>
            <Thread threadId={params.threadId} />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
