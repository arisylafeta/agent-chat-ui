import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SaveLookRequest, SaveLookResponse } from '@/types/studio';

const MAX_PRODUCTS = 6;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/studio/save-look
 * Persist generated look to database and storage
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: SaveLookRequest = await request.json();
    const { title, products, generatedImageBase64 } = body;

    // 3. Validate inputs
    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Products array is required' },
        { status: 400 }
      );
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'At least 1 product required' },
        { status: 400 }
      );
    }

    if (products.length > MAX_PRODUCTS) {
      return NextResponse.json(
        { error: 'Invalid request', message: `Maximum ${MAX_PRODUCTS} products allowed` },
        { status: 400 }
      );
    }

    if (!generatedImageBase64 || !generatedImageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image', message: 'Generated image must be a valid base64 data URL' },
        { status: 400 }
      );
    }

    // 4. Convert base64 to buffer
    const matches = generatedImageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image', message: 'Invalid base64 image format' },
        { status: 400 }
      );
    }

    const imageType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'File too large', message: 'Image size must be less than 10MB' },
        { status: 400 }
      );
    }

    // 5. Generate lookbook ID
    const lookbookId = crypto.randomUUID();
    const filename = `${user.id}/${lookbookId}.${imageType}`;

    // 6. Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('generated-looks')
      .upload(filename, buffer, {
        contentType: `image/${imageType}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', message: 'Failed to upload image to storage' },
        { status: 500 }
      );
    }

    // 7. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generated-looks')
      .getPublicUrl(filename);

    // 8. Create lookbook entry
    const lookbookTitle = title?.trim() || `Look - ${new Date().toISOString()}`;
    
    const { data: lookbook, error: lookbookError } = await supabase
      .from('lookbooks')
      .insert({
        id: lookbookId,
        owner_id: user.id,
        title: lookbookTitle,
        cover_image_url: publicUrl,
        visibility: 'private',
      })
      .select()
      .single();

    if (lookbookError) {
      console.error('Lookbook creation error:', lookbookError);
      
      // Cleanup: delete uploaded image
      await supabase.storage
        .from('generated-looks')
        .remove([filename]);

      return NextResponse.json(
        { error: 'Save failed', message: 'Failed to create lookbook entry' },
        { status: 500 }
      );
    }

    // 9. Process products and create wardrobe items
    const wardrobeItemIds: string[] = [];

    for (const product of products) {
      try {
        // Check if product has sourceData (from search results)
        if (product.sourceData && Object.keys(product.sourceData).length > 0) {
          // Create wardrobe item for search result product
          const { data: wardrobeItem, error: wardrobeError } = await supabase
            .from('wardrobe_items')
            .insert({
              user_id: user.id,
              name: product.title,
              brand: product.brand || 'Unknown',
              category: 'online',
              image_url: product.image,
              source: 'search_result',
            })
            .select()
            .single();

          if (wardrobeError) {
            console.error('Failed to create wardrobe item:', wardrobeError);
            continue; // Skip this product but continue with others
          }

          wardrobeItemIds.push(wardrobeItem.id);
        } else {
          // Product is already in wardrobe, use its ID
          wardrobeItemIds.push(product.id);
        }
      } catch (error) {
        console.error('Error processing product:', error);
        continue;
      }
    }

    // 10. Link wardrobe items to lookbook
    if (wardrobeItemIds.length > 0) {
      const linkRecords = wardrobeItemIds.map(itemId => ({
        lookbook_id: lookbookId,
        wardrobe_item_id: itemId,
        slot: 'base', // Default for MVP
        role: 'other', // Default for MVP
      }));

      const { error: linkError } = await supabase
        .from('lookbook_wardrobe_items')
        .insert(linkRecords);

      if (linkError) {
        console.error('Failed to link wardrobe items:', linkError);
        // Don't fail the request, just log the error
      }
    }

    // 11. Return success response
    const response: SaveLookResponse = {
      lookbook: lookbook,
      imageUrl: publicUrl,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Save look error:', error);
    return NextResponse.json(
      { error: 'Save failed', message: 'Failed to save look to database' },
      { status: 500 }
    );
  }
}
