import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GENERATION_TIMEOUT_MS = 30000; // 30 seconds
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Helper function to fetch image from URL and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(`Invalid image type from ${url}. Expected JPEG, PNG, or WebP.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(`Image from ${url} exceeds 10MB size limit`);
  }

  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  return { base64, mimeType: contentType };
}

/**
 * POST /api/studio/generate-look
 * Generate AI-powered virtual try-on image using Gemini 2.5 Flash Image
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    // 2. Parse JSON body
    const body = await request.json();
    const { avatarUrl, productUrls } = body;

    // 3. Validate inputs
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Avatar image URL is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(productUrls) || productUrls.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'At least 1 product image URL required' },
        { status: 400 }
      );
    }

    if (productUrls.length > 6) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Maximum 6 product images allowed' },
        { status: 400 }
      );
    }

    // 4. Check Gemini API key
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Configuration error', message: 'AI service not configured' },
        { status: 500 }
      );
    }

    // 5. Fetch images from URLs (server-side to avoid CORS)
    let avatarBase64: string;
    let avatarMimeType: string;
    
    try {
      const avatarData = await fetchImageAsBase64(avatarUrl);
      avatarBase64 = avatarData.base64;
      avatarMimeType = avatarData.mimeType;
    } catch (error: any) {
      console.error('Failed to fetch avatar image:', error);
      return NextResponse.json(
        { error: 'Invalid avatar', message: `Failed to load avatar image: ${error.message}` },
        { status: 400 }
      );
    }

    // 6. Fetch product images
    const productImages: Array<{ base64: string; mimeType: string }> = [];
    const failedProducts: number[] = [];

    for (let i = 0; i < productUrls.length; i++) {
      try {
        const productData = await fetchImageAsBase64(productUrls[i]);
        productImages.push(productData);
      } catch (error: any) {
        console.error(`Failed to fetch product image ${i}:`, error);
        failedProducts.push(i + 1);
      }
    }

    // Check if at least one product image loaded successfully
    if (productImages.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to load images', 
          message: `Could not load any product images. Please check the image URLs and try again.` 
        },
        { status: 400 }
      );
    }

    // Warn if some products failed but continue with successful ones
    if (failedProducts.length > 0) {
      console.warn(`Failed to load ${failedProducts.length} product image(s): ${failedProducts.join(', ')}`);
    }

    // 7. Prepare Gemini API request
    const genAI = new GoogleGenAI({
      apiKey: GEMINI_API_KEY || '',
    });

    // Construct prompt - simple and direct for virtual try-on
    const clothingList = productImages.map((_, idx) => `<image${idx + 1}>`).join(', ');
    const promptText = `Replace the clothes on this person with these clothes ${clothingList}. Maintain 100% realism, proportions, and body figure.`;

    // Prepare prompt parts: text + avatar + product images
    const promptParts = [
      {
        text: promptText,
      },
      {
        inlineData: {
          mimeType: avatarMimeType,
          data: avatarBase64,
        },
      },
      ...productImages.map((product) => ({
        inlineData: {
          mimeType: product.mimeType,
          data: product.base64,
        },
      })),
    ];

    // 8. Call Gemini API with timeout
    const generationPromise = genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: promptParts,
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout')), GENERATION_TIMEOUT_MS);
    });

    const result = await Promise.race([generationPromise, timeoutPromise]) as any;

    if (!result) {
      throw new Error('No response from Gemini API');
    }

    // Extract the generated image from response
    let generatedImageDataUrl = `data:${avatarMimeType};base64,${avatarBase64}`; // Fallback to avatar
    
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedImageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || avatarMimeType;
          generatedImageDataUrl = `data:${mimeType};base64,${generatedImageData}`;
          console.log('✅ Successfully extracted generated image from Gemini');
          break;
        }
      }
    } else {
      console.warn('⚠️ No generated image in response, using avatar as fallback');
    }

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      generatedImage: generatedImageDataUrl,
      processingTimeMs,
    });

  } catch (error: any) {
    console.error('Generate look error:', error);

    if (error.message === 'Generation timeout') {
      return NextResponse.json(
        { error: 'Timeout', message: 'Image generation timed out after 30 seconds' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Generation failed', message: 'Failed to generate look image' },
      { status: 500 }
    );
  }
}
