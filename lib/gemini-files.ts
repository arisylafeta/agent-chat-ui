/**
 * Gemini Files API Utilities
 *
 * Provides functions to upload images to Gemini Files API and get URIs
 * for use in generateContent requests. Files persist for 48 hours.
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface UploadedFile {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  displayName?: string;
}

export interface ImageUploadOptions {
  displayName?: string;
  role?: string; // e.g., "top", "pants", "shoes", "avatar"
}

/**
 * Upload an image to Gemini Files API
 * @param base64Data - Base64-encoded image data (without data URL prefix)
 * @param mimeType - Image MIME type (e.g., "image/jpeg")
 * @param options - Optional metadata for the upload
 * @returns Uploaded file metadata including URI
 */
export async function uploadImageToGemini(
  base64Data: string,
  mimeType: string,
  options: ImageUploadOptions = {}
): Promise<UploadedFile> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  try {
    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Create a File object from the buffer
    const blob = new Blob([imageBuffer], { type: mimeType });
    const file = new File([blob], options.displayName || 'image', { type: mimeType });

    // Upload to Gemini Files API
    const uploadResponse = await genAI.files.upload({
      file,
    });

    console.log(`✅ Uploaded ${options.displayName || 'image'} to Gemini Files API`);
    console.log(`   URI: ${uploadResponse.uri}`);
    console.log(`   Name: ${uploadResponse.name}`);

    if (!uploadResponse.uri || !uploadResponse.name) {
      throw new Error('Upload response missing required fields (uri or name)');
    }

    return {
      uri: uploadResponse.uri,
      name: uploadResponse.name,
      mimeType: uploadResponse.mimeType || mimeType,
      sizeBytes: imageBuffer.length,
      displayName: options.displayName,
    };
  } catch (error: any) {
    console.error('❌ Failed to upload image to Gemini Files API:', error);
    throw new Error(`Gemini Files API upload failed: ${error.message}`);
  }
}

/**
 * Upload multiple images to Gemini Files API
 * @param images - Array of images with base64 data, MIME type, and optional metadata
 * @returns Array of uploaded file metadata
 */
export async function uploadImagesToGemini(
  images: Array<{
    base64: string;
    mimeType: string;
    role?: string;
    displayName?: string;
  }>
): Promise<UploadedFile[]> {
  const uploadPromises = images.map((img, index) =>
    uploadImageToGemini(img.base64, img.mimeType, {
      displayName: img.displayName || img.role || `image-${index + 1}`,
      role: img.role,
    })
  );

  try {
    return await Promise.all(uploadPromises);
  } catch (error: any) {
    console.error('❌ Failed to upload one or more images:', error);
    throw error;
  }
}

/**
 * Wait for file to be in ACTIVE state (if needed)
 * Files API usually makes files immediately available, but this provides a safety check
 */
export async function waitForFileActive(
  fileName: string,
  maxWaitMs: number = 10000
): Promise<void> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const file = await genAI.files.get({ name: fileName });

      if (file.state === 'ACTIVE') {
        console.log(`✅ File ${fileName} is ACTIVE and ready`);
        return;
      }

      if (file.state === 'FAILED') {
        throw new Error(`File ${fileName} processing failed`);
      }

      // Wait 500ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`Error checking file status: ${error.message}`);
      throw error;
    }
  }

  throw new Error(`File ${fileName} did not become ACTIVE within ${maxWaitMs}ms`);
}
