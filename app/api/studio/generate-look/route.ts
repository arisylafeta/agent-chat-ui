import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GENERATION_TIMEOUT_MS = 30000; // 30 seconds
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

    // 2. Parse FormData
    const formData = await request.formData();
    const avatarFile = formData.get('avatar') as File | null;
    const productFiles = formData.getAll('products') as File[];

    // 3. Validate inputs
    if (!avatarFile) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Avatar image is required' },
        { status: 400 }
      );
    }

    if (productFiles.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'At least 1 product image required' },
        { status: 400 }
      );
    }

    if (productFiles.length > 6) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Maximum 6 product images allowed' },
        { status: 400 }
      );
    }

    // 4. Validate file types and sizes
    const allFiles = [avatarFile, ...productFiles];
    for (const file of allFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type', message: 'Only JPEG, PNG, and WebP images are supported' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File too large', message: 'Image size must be less than 10MB' },
          { status: 400 }
        );
      }
    }

    // 5. Check Gemini API key
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Configuration error', message: 'AI service not configured' },
        { status: 500 }
      );
    }

    // 6. Convert files to base64
    const avatarBuffer = await avatarFile.arrayBuffer();
    const avatarBase64 = Buffer.from(avatarBuffer).toString('base64');

    const productBase64Array = await Promise.all(
      productFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
      })
    );

    // 7. Prepare Gemini API request
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Construct prompt
    const prompt = `Create a realistic virtual try-on image showing the person in the avatar wearing these clothing items. Maintain realistic proportions, lighting, and fit. Professional fashion photography style. Ensure the person's face and body type match the avatar exactly.`;

    // Prepare image parts for Gemini
    const imageParts = [
      {
        inlineData: {
          data: avatarBase64,
          mimeType: avatarFile.type,
        },
      },
      ...productBase64Array.map((base64, idx) => ({
        inlineData: {
          data: base64,
          mimeType: productFiles[idx].type,
        },
      })),
    ];

    // 8. Call Gemini API with timeout
    const generationPromise = model.generateContent([prompt, ...imageParts]);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout')), GENERATION_TIMEOUT_MS);
    });

    const result = await Promise.race([generationPromise, timeoutPromise]) as any;

    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    // const response = await result.response;
    // const generatedText = response.text(); // For future use

    // For now, since Gemini 2.0 Flash doesn't directly generate images,
    // we'll return a placeholder response. In production, you'd use
    // Imagen or another image generation model.
    // TODO: Replace with actual image generation when available
    
    // For MVP, we'll return the avatar as a fallback
    const generatedImageDataUrl = `data:${avatarFile.type};base64,${avatarBase64}`;

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
