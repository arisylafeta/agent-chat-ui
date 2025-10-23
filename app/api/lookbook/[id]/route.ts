import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * DELETE /api/lookbook/[id]
 * Delete a lookbook and all associated data (cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: lookbookId } = await params;

    // 2. Validate lookbook ID
    if (!lookbookId) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Lookbook ID is required' },
        { status: 400 }
      );
    }

    // 3. Fetch the lookbook to verify ownership and get image path
    const { data: lookbook, error: fetchError } = await supabase
      .from('lookbooks')
      .select('id, owner_id, cover_image_url')
      .eq('id', lookbookId)
      .single();

    if (fetchError || !lookbook) {
      return NextResponse.json(
        { error: 'Not found', message: 'Lookbook not found' },
        { status: 404 }
      );
    }

    // 4. Verify ownership
    if (lookbook.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this lookbook' },
        { status: 403 }
      );
    }

    // 5. Extract image filename from cover_image_url
    let imageFilename: string | null = null;
    if (lookbook.cover_image_url) {
      try {
        // Expected format: https://{project}.supabase.co/storage/v1/object/public/generated-looks/{user_id}/{lookbook_id}.{ext}
        const url = new URL(lookbook.cover_image_url);
        const pathParts = url.pathname.split('/generated-looks/');
        if (pathParts.length > 1) {
          imageFilename = pathParts[1]; // Should be: {user_id}/{lookbook_id}.{ext}
        }
      } catch (urlError) {
        console.error('Failed to parse cover image URL:', urlError);
        // Continue with deletion even if image parsing fails
      }
    }

    // 6. Delete the lookbook (cascade will handle junction tables)
    const { error: deleteError } = await supabase
      .from('lookbooks')
      .delete()
      .eq('id', lookbookId);

    if (deleteError) {
      console.error('Failed to delete lookbook:', deleteError);
      return NextResponse.json(
        { error: 'Delete failed', message: 'Failed to delete lookbook from database' },
        { status: 500 }
      );
    }

    // 7. Delete the image from storage (if it exists)
    if (imageFilename) {
      const { error: storageError } = await supabase.storage
        .from('generated-looks')
        .remove([imageFilename]);

      if (storageError) {
        console.error('Failed to delete image from storage:', storageError);
        // Don't fail the request - the database record is already deleted
      }
    }

    // 8. Return success response
    return NextResponse.json(
      { message: 'Lookbook deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete lookbook error:', error);
    return NextResponse.json(
      { error: 'Delete failed', message: 'Failed to delete lookbook' },
      { status: 500 }
    );
  }
}
