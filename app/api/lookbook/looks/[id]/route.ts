import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/lookbook/looks/[id]
 * Fetch a single lookbook with its linked wardrobe items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch lookbook with joined wardrobe items
    const { data, error } = await supabase
      .from('lookbooks')
      .select(`
        *,
        lookbook_wardrobe_items (
          category,
          role,
          note,
          wardrobe_items (
            id,
            name,
            brand,
            category,
            role,
            image_url,
            metadata
          )
        )
      `)
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Lookbook not found' }, { status: 404 });
    }

    // Flatten structure for easier consumption
    const products = data.lookbook_wardrobe_items.map((lwi: any) => ({
      ...lwi.wardrobe_items,
      linkCategory: lwi.category, // Category from junction table (denormalized)
      linkRole: lwi.role, // Role from junction table (denormalized)
      note: lwi.note,
    }));

    return NextResponse.json({
      lookbook: {
        id: data.id,
        title: data.title,
        description: data.description,
        cover_image_url: data.cover_image_url,
        visibility: data.visibility,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      products,
    });
  } catch (error) {
    console.error('Error fetching lookbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
