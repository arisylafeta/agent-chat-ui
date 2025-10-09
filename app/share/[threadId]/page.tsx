import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { SharePageWrapper } from '@/components/share/share-page-wrapper';

export default async function SharePage({ 
  params 
}: { 
  params: { threadId: string } 
}) {
  const supabase = await createClient();
  
  // Fetch thread without requiring authentication
  // This is a public endpoint - we only check if thread is public
  const { data: thread, error } = await supabase
    .from('thread')
    .select('thread_id, name, is_public, user_id')
    .eq('thread_id', params.threadId)
    .single();
  
  // If thread doesn't exist or is private, show 404
  if (error || !thread || !thread.is_public) {
    notFound();
  }
  
  return (
    <SharePageWrapper 
      threadId={params.threadId} 
      threadName={thread.name || 'Shared Thread'} 
    />
  );
}
