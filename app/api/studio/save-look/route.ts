import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SaveLookRequest, SaveLookResponse } from '@/types/studio';
import { getProductRole } from '@/types/outfit-roles';

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

    // 9. Process products and create wardrobe items with role tracking
    const wardrobeItemIds: string[] = [];
    const itemMetadataMap = new Map<string, { category: string, role: string }>(); // Track category + role per item

    for (const product of products) {
      try {
        // Extract category and role from sourceData
        const productCategory = product.sourceData?.category || 'other';
        const productRole = product.sourceData?.role || getProductRole(product.sourceData as any) || 'accessory';

        if (product.sourceData && Object.keys(product.sourceData).length > 0) {
          // Check for duplicates in wardrobe based on metadata or image URL
          // First try to find by metadata (most accurate for search results)
          let existingItem = null;

          // Try to find by product URL/link (most reliable unique identifier)
          // Check both product_url and product_link since different sources use different field names
          const productUrl = product.sourceData.product_url || product.sourceData.product_link;

          if (productUrl) {
            // Try product_url first
            const { data: itemByUrl } = await supabase
              .from('wardrobe_items')
              .select('id, category, role')
              .eq('user_id', user.id)
              .filter('metadata->>product_url', 'eq', productUrl)
              .maybeSingle();

            if (itemByUrl) {
              existingItem = itemByUrl;
            } else {
              // Fallback to product_link field
              const { data: itemByLink } = await supabase
                .from('wardrobe_items')
                .select('id, category, role')
                .eq('user_id', user.id)
                .filter('metadata->>product_link', 'eq', productUrl)
                .maybeSingle();

              if (itemByLink) {
                existingItem = itemByLink;
              }
            }
          }

          if (existingItem) {
            // Use existing item instead of creating duplicate
            const itemCategory = existingItem.category || productCategory;
            const itemRole = existingItem.role || productRole;

            wardrobeItemIds.push(existingItem.id);
            itemMetadataMap.set(existingItem.id, {
              category: itemCategory,
              role: itemRole
            });
          } else {
            // Download external image and upload to storage
            let uploadedImageUrl = product.image;

            try {
              // Fetch the external image
              const imageResponse = await fetch(product.image);
              if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`);
              }

              // Get the image buffer
              const imageBuffer = await imageResponse.arrayBuffer();

              // Determine file extension from content-type or URL
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              const fileExt = contentType.split('/')[1] || 'jpg';

              // Generate unique filename
              const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

              // Upload to Supabase Storage
              const { error: storageError } = await supabase.storage
                .from('clothing-images')
                .upload(fileName, imageBuffer, {
                  contentType,
                  cacheControl: '3600',
                  upsert: false,
                });

              if (storageError) {
                console.error('Failed to upload image to storage:', storageError);
                // Fall back to using the original external URL
              } else {
                // Get public URL for the uploaded image
                const { data: { publicUrl } } = supabase.storage
                  .from('clothing-images')
                  .getPublicUrl(fileName);

                uploadedImageUrl = publicUrl;
              }
            } catch (imageError) {
              console.error('Error downloading/uploading image:', imageError);
              // Fall back to using the original external URL
            }

            // Create new wardrobe item for search result product
            const { data: wardrobeItem, error: wardrobeError } = await supabase
              .from('wardrobe_items')
              .insert({
                user_id: user.id,
                name: product.title,
                brand: product.brand || 'Unknown',
                category: productCategory, // Real category from sourceData
                role: productRole, // Real role from sourceData or derived
                image_url: uploadedImageUrl, // Use uploaded image URL or fallback to external
                source: 'search_result',
                metadata: product.sourceData, // Store full snapshot in JSONB
              })
              .select()
              .single();

            if (wardrobeError) {
              console.error('Failed to create wardrobe item:', wardrobeError);
              continue; // Skip this product but continue with others
            }

            wardrobeItemIds.push(wardrobeItem.id);
            itemMetadataMap.set(wardrobeItem.id, {
              category: productCategory,
              role: productRole
            });
          }
        } else {
          // Product is already in wardrobe - fetch its category and role
          const { data: existingItem } = await supabase
            .from('wardrobe_items')
            .select('category, role')
            .eq('id', product.id)
            .single();

          if (existingItem) {
            const itemCategory = existingItem.category || 'other';
            const itemRole = existingItem.role ||
                            getProductRole({ category: itemCategory }) ||
                            'accessory';

            wardrobeItemIds.push(product.id);
            itemMetadataMap.set(product.id, {
              category: itemCategory,
              role: itemRole
            });
          } else {
            // Fallback if item not found
            wardrobeItemIds.push(product.id);
            itemMetadataMap.set(product.id, {
              category: 'other',
              role: 'accessory'
            });
          }
        }
      } catch (error) {
        console.error('Error processing product:', error);
        continue;
      }
    }

    // 10. Link wardrobe items to lookbook with category + role (no slot)
    if (wardrobeItemIds.length > 0) {
      const linkRecords = wardrobeItemIds.map(itemId => {
        const metadata = itemMetadataMap.get(itemId) || { category: 'other', role: 'accessory' };
        return {
          lookbook_id: lookbookId,
          wardrobe_item_id: itemId,
          category: metadata.category, // Denormalized category
          role: metadata.role, // Denormalized role
          // No slot field
        };
      });

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
