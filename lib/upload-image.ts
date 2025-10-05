import { createClient } from "@/utils/supabase/client";

/**
 * Upload an image file to Supabase storage and return the public URL.
 * 
 * @param file - The image file to upload
 * @returns Public URL to the uploaded image
 */
export async function uploadImageToSupabase(file: File): Promise<string> {
  const supabase = createClient();
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const fileExt = file.name.split('.').pop();
  const fileName = `${timestamp}-${randomId}.${fileExt}`;
  
  // Upload to 'chat-images' bucket (create this bucket in Supabase if it doesn't exist)
  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('[uploadImageToSupabase] Upload failed:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('chat-images')
    .getPublicUrl(data.path);

  console.log('[uploadImageToSupabase] Image uploaded:', publicUrl);
  return publicUrl;
}

/**
 * Upload image with fallback to base64 if Supabase fails.
 * 
 * @param file - The image file
 * @returns Public URL or base64 data URI
 */
export async function uploadImageWithFallback(file: File): Promise<{ url: string; isBase64: boolean }> {
  try {
    const url = await uploadImageToSupabase(file);
    return { url, isBase64: false };
  } catch (error) {
    console.warn('[uploadImageWithFallback] Supabase upload failed, falling back to base64:', error);
    
    // Fallback to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({ url: result, isBase64: true });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
