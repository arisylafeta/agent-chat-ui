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

  // For images: Upload to Supabase first to avoid large JSON payloads
  if (supportedImageTypes.includes(file.type)) {
    try {
      const { url, isBase64 } = await uploadImageWithFallback(file);

      // Always return a content block with URL
      // Backend will fetch the image and convert to base64 data URI for model vision
      return {
        type: "image",
        source_type: "base64", // Required by Base64ContentBlock type, data contains URL
        mime_type: file.type,
        data: isBase64 ? url : url, // URL (either Supabase or data URI as fallback)
        metadata: { name: file.name, uploaded: !isBase64 },
      };
    } catch (error) {
      console.error("[fileToContentBlock] Image upload failed:", error);
      toast.error("Failed to upload image. Please try again.");
      return Promise.reject(error);
    }
  }

  // PDF: Convert to base64
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
  // image type (accepts both "base64" and "url" source types)
  if (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    ((block as { source_type: unknown }).source_type === "base64" ||
      (block as { source_type: unknown }).source_type === "url") &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/")
  ) {
    return true;
  }
  return false;
}
