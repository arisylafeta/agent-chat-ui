import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query thread table directly from Supabase
    // This is the source of truth for thread ownership
    const { data: threads, error: dbError } = await supabase
      .from('thread')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (dbError) {
      console.error('[API /threads] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      );
    }

    console.log(`[API /threads] Found ${threads?.length || 0} threads for user ${user.id}`);

    return NextResponse.json({ threads: threads || [] });
  } catch (error) {
    console.error('[API /threads] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
