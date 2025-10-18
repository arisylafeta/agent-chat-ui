import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch user's lookbooks
    const { data: lookbooks, error, count } = await supabase
      .from('lookbooks')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching lookbooks:', error);
      return NextResponse.json({ error: 'Failed to fetch lookbooks' }, { status: 500 });
    }

    return NextResponse.json({
      lookbooks: lookbooks || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/lookbooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, cover_image_url, visibility = 'private' } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      );
    }

    if (cover_image_url && typeof cover_image_url !== 'string') {
      return NextResponse.json(
        { error: 'Cover image URL must be a string' },
        { status: 400 }
      );
    }

    if (!['private', 'shared', 'public'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Visibility must be one of: private, shared, public' },
        { status: 400 }
      );
    }

    const { data: lookbook, error } = await supabase
      .from('lookbooks')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        cover_image_url: cover_image_url?.trim() || null,
        visibility,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lookbook:', error);
      return NextResponse.json(
        { error: 'Failed to create lookbook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ lookbook }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/lookbooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
