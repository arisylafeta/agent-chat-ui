import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { SharePageWrapper } from '@/components/share/share-page-wrapper';

export default async function SharePage({ 
  params 
}: { 
  params: Promise<{ threadId: string }> 
}) {
  const supabase = await createClient();
  const { threadId } = await params;
  
  // Fetch thread without requiring authentication
  // This is a public endpoint - we only check if thread is public
  const { data: thread, error } = await supabase
    .from('thread')
    .select('thread_id, name, is_public, user_id')
    .eq('thread_id', threadId)
    .single();
  
  // If thread doesn't exist or is private, show 404
  if (error || !thread || !thread.is_public) {
    notFound();
  }
  
  return (
    <SharePageWrapper 
      threadId={threadId} 
      threadName={thread.name || 'Shared Thread'} 
    />
  );
}
