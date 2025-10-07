import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const supabase = await createClient();
    const { threadId } = params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', exists: false },
        { status: 401 }
      );
    }

    // Check if thread exists and user has access (owner OR is_public)
    const { data: thread, error: dbError } = await supabase
      .from('threads')
      .select('thread_id, owner_id, is_public')
      .eq('thread_id', threadId)
      .or(`owner_id.eq.${user.id},is_public.eq.true`)
      .single();

    if (dbError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found or access denied', exists: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      exists: true,
      thread: {
        thread_id: thread.thread_id,
        is_owner: thread.owner_id === user.id,
        is_public: thread.is_public,
      }
    });
  } catch (error) {
    console.error('[API /threads/validate/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', exists: false },
      { status: 500 }
    );
  }
}
