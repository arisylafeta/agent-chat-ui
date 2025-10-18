import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Avatar, SaveAvatarData, AvatarResponse, SaveAvatarResponse } from '@/types/lookbook';

// GET - Fetch user's avatar
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query avatars table for user's avatar
    const { data: avatar, error: dbError } = await supabase
      .from('avatars')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbError) {
      // If no avatar found, return null (not an error)
      if (dbError.code === 'PGRST116') {
        const response: AvatarResponse = { avatar: null };
        return NextResponse.json(response);
      }

      console.error('Database error fetching avatar:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch avatar' },
        { status: 500 }
      );
    }

    const response: AvatarResponse = { avatar: avatar as Avatar };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/lookbook/avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save avatar to storage and database
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse JSON request
    const body: SaveAvatarData = await request.json();
    const { avatarImageDataUrl, measurements } = body;

    if (!avatarImageDataUrl) {
      return NextResponse.json(
        { error: 'Avatar image is required' },
        { status: 400 }
      );
    }

    if (!measurements) {
      return NextResponse.json(
        { error: 'Measurements are required' },
        { status: 400 }
      );
    }

    // Validate required measurements
    if (!measurements.height_cm || !measurements.weight_kg) {
      return NextResponse.json(
        { error: 'Height and weight are required measurements' },
        { status: 400 }
      );
    }

    // Convert data URL to Blob
    const base64Data = avatarImageDataUrl.split(',')[1];
    const mimeType = avatarImageDataUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const fileName = `${user.id}/avatar.png`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload avatar image' },
        { status: 500 }
      );
    }

    // Get public URL from storage
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Upsert to avatars table
    const { data: avatarData, error: dbError } = await supabase
      .from('avatars')
      .upsert(
        {
          user_id: user.id,
          image_url: imageUrl,
          height_cm: measurements.height_cm,
          weight_kg: measurements.weight_kg,
          body_shape: measurements.body_shape || null,
          measurements: measurements,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (dbError) {
      console.error('Database error saving avatar:', dbError);
      return NextResponse.json(
        { error: 'Failed to save avatar to database' },
        { status: 500 }
      );
    }

    const response: SaveAvatarResponse = {
      success: true,
      avatar: avatarData as Avatar,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in POST /api/lookbook/avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
