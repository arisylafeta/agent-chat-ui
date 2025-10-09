"use client";

import { ShareThreadView } from './share-thread-view';
import { StreamProvider } from '@/providers/Stream';
import { ThreadProvider } from '@/providers/Thread';
import { ArtifactProvider } from '@/components/artifact/artifact';

interface SharePageWrapperProps {
  threadId: string;
  threadName: string;
}

export function SharePageWrapper({ threadId, threadName }: SharePageWrapperProps) {
  return (
    <ArtifactProvider>
      <ThreadProvider>
        <StreamProvider>
          <ShareThreadView 
            threadId={threadId} 
            threadName={threadName} 
          />
        </StreamProvider>
      </ThreadProvider>
    </ArtifactProvider>
  );
}
