import type { Base64ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";
import { uploadImageWithFallback } from "./upload-image";

// Returns a Promise of a typed multimodal block for images or PDFs
export async function fileToContentBlock(
  file: File,
): Promise<Base64ContentBlock> {
  const supportedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const supportedFileTypes = [...supportedImageTypes, "application/pdf"];

  if (!supportedFileTypes.includes(file.type)) {
    toast.error(
      `Unsupported file type: ${file.type}. Supported types are: ${supportedFileTypes.join(", ")}`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  // For images: Upload to Supabase first, get public URL
  if (supportedImageTypes.includes(file.type)) {
    try {
      const { url, isBase64 } = await uploadImageWithFallback(file);
      
      if (isBase64) {
        // Fallback: use base64 (remove data URI prefix)
        const data = url.split(",")[1];
        return {
          type: "image",
          source_type: "base64",
          mime_type: file.type,
          data,
          metadata: { name: file.name },
        };
      } else {
        // Success: use Supabase URL (put URL in data field)
        // The backend will detect it's a URL and handle accordingly
        return {
          type: "image",
          source_type: "base64", // Keep as base64 for type compatibility
          mime_type: file.type,
          data: url, // Public Supabase URL (not actually base64, but backend handles it)
          metadata: { name: file.name, uploaded: true, isUrl: true },
        };
      }
    } catch (error) {
      console.error('[fileToContentBlock] Image upload failed:', error);
      toast.error("Failed to upload image. Please try again.");
      return Promise.reject(error);
    }
  }

  // PDF: Keep base64 for now
  const data = await fileToBase64(file);
  return {
    type: "file",
    source_type: "base64",
    mime_type: "application/pdf",
    data,
    metadata: { filename: file.name },
  };
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Type guard for Base64ContentBlock
export function isBase64ContentBlock(
  block: unknown,
): block is Base64ContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  // file type (legacy)
  if (
    (block as { type: unknown }).type === "file" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    ((block as { mime_type: string }).mime_type.startsWith("image/") ||
      (block as { mime_type: string }).mime_type === "application/pdf")
  ) {
    return true;
  }
  // image type (new)
  if (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/")
  ) {
    return true;
  }
  return false;
}
