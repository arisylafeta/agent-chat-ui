import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, is_public } = body;

    // Build update object
    const updates: { name?: string; is_public?: boolean; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };
    
    if (name !== undefined) updates.name = name;
    if (is_public !== undefined) updates.is_public = is_public;

    // Update thread (owner only via RLS)
    const { data: thread, error: dbError } = await supabase
      .from('threads')
      .update(updates)
      .eq('thread_id', threadId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (dbError) {
      console.error('[API /threads/[id]] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update thread' },
        { status: 500 }
      );
    }

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error('[API /threads/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete thread (owner only via RLS)
    const { error: dbError } = await supabase
      .from('threads')
      .delete()
      .eq('thread_id', threadId)
      .eq('owner_id', user.id);

    if (dbError) {
      console.error('[API /threads/[id]] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete thread' },
        { status: 500 }
      );
    }

    // Also delete from LangGraph (via SDK)
    // Note: This requires calling LangGraph API with JWT
    // For now, we'll just delete from threads table
    // LangGraph checkpoints will remain but won't be accessible

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /threads/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
