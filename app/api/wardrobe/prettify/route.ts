import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { PrettifyResponse } from '@/lib/db/wardrobe-types';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

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

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const category = formData.get('category') as string;

    if (!image) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Validate image file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const originalImageDataUrl = `data:${image.type};base64,${imageBase64}`;

    try {
      // Use Gemini 2.5 Flash Image model for native image generation
      const prompt = [
        {
          text: `Professional product image of the ${category} in this image against a white background. Remove all other elements aside from the main item. 100% realistic, side or front view. Maintain shape, size, color.`,
        },
        {
          inlineData: {
            mimeType: image.type,
            data: imageBase64,
          },
        },
      ];

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
      });

      // Extract the generated image from response
      let prettifiedImageDataUrl = originalImageDataUrl;
      
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const generatedImageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || image.type;
            prettifiedImageDataUrl = `data:${mimeType};base64,${generatedImageData}`;
            break;
          }
        }
      }

      const prettifyResponse: PrettifyResponse = {
        prettifiedImage: prettifiedImageDataUrl,
        originalImage: originalImageDataUrl,
      };

      return NextResponse.json(prettifyResponse);
    } catch (aiError: any) {
      console.error('Gemini API error:', aiError);

      // Fallback: return original image if AI processing fails
      const fallbackResponse: PrettifyResponse = {
        prettifiedImage: originalImageDataUrl,
        originalImage: originalImageDataUrl,
      };

      return NextResponse.json(fallbackResponse, { status: 200 });
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/wardrobe/prettify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
