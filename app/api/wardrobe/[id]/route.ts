import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { WardrobeItemResponse } from '@/lib/db/wardrobe-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch item (RLS will ensure user can only access their own items)
    const { data: item, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      console.error('Error fetching clothing item:', error);
      return NextResponse.json(
        { error: 'Failed to fetch item', details: error.message },
        { status: 500 }
      );
    }

    const response: WardrobeItemResponse = { item };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/wardrobe/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Remove fields that shouldn't be updated
    const { id: _, user_id: _user_id, created_at: _created_at, updated_at: _updated_at, ...updateData } = body;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update item (RLS will ensure user can only update their own items)
    const { data: item, error } = await supabase
      .from('wardrobe_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      console.error('Error updating clothing item:', error);
      return NextResponse.json(
        { error: 'Failed to update item', details: error.message },
        { status: 500 }
      );
    }

    const response: WardrobeItemResponse = { item };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/wardrobe/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, fetch the item to get the image URL
    const { data: item, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      console.error('Error fetching item for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to delete item', details: fetchError.message },
        { status: 500 }
      );
    }

    // Extract file path from image URL
    const imageUrl = item.image_url;
    let filePath: string | null = null;

    if (imageUrl) {
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/storage/v1/object/public/clothing-images/');
        if (pathParts.length > 1) {
          filePath = pathParts[1];
        }
      } catch {
        console.warn('Could not parse image URL for deletion:', imageUrl);
      }
    }

    // Delete the database record (RLS will ensure user can only delete their own items)
    const { error: deleteError } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting clothing item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete item', details: deleteError.message },
        { status: 500 }
      );
    }

    // Delete the image from storage if we have a file path
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('clothing-images')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete image from storage:', storageError);
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/wardrobe/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
