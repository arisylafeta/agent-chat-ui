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

    // Query threads table: owned threads OR public threads
    const { data: threads, error: dbError } = await supabase
      .from('threads')
      .select('*')
      .or(`owner_id.eq.${user.id},is_public.eq.true`)
      .order('updated_at', { ascending: false });

    if (dbError) {
      console.error('[API /threads] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ threads: threads || [] });
  } catch (error) {
    console.error('[API /threads] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
