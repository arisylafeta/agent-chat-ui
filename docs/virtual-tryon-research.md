# Virtual Try-On Research & Implementation Guide

**Date**: 2025-10-20
**Author**: Claude Code
**Status**: Active Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Gemini Image Generation API](#gemini-image-generation-api)
3. [Gemini Files API](#gemini-files-api)
4. [Gemini Image Understanding](#gemini-image-understanding)
5. [BAML Programming Language](#baml-programming-language)
6. [Implementation Details](#implementation-details)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Future Improvements](#future-improvements)

---

## Executive Summary

This document consolidates research on improving the virtual try-on feature using Google's Gemini AI models. The key findings address:

1. **Current Issue**: "No generated image in response" - likely due to incorrect API usage or response handling
2. **Solution**: Enhanced error handling, Files API integration, and structured prompting with image metadata
3. **Future**: BAML integration for type-safe prompt engineering

### Key Improvements Implemented

- ✅ Enhanced error handling with detailed response logging
- ✅ Gemini Files API integration for better reliability
- ✅ Labeled image prompts with product metadata (role/category)
- ✅ Backward-compatible API changes
- 🔄 BAML evaluation (future consideration)

---

## Gemini Image Generation API

### Overview

**Model**: `gemini-2.5-flash-image`
**Purpose**: Text-to-image, image editing, and multi-image composition

### Core Capabilities

1. **Text-to-Image**: Generate images from descriptive prompts
2. **Image Editing**: Modify existing images using text instructions
3. **Multi-Image Composition**: Combine elements from multiple source images (our use case)
4. **Iterative Refinement**: Progressively improve images through conversation
5. **Text Rendering**: Generate legible text within images

### API Method

```typescript
const response = await genAI.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: [
    { text: "Your prompt here" },
    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
    // ... more images
  ],
});
```

### Response Format

```typescript
{
  candidates: [{
    content: {
      parts: [{
        inlineData: {
          mimeType: "image/png",
          data: "<base64-encoded-image>"
        }
      }]
    },
    finishReason: "STOP" | "SAFETY" | "MAX_TOKENS",
    safetyRatings: [...]
  }]
}
```

### Important Limitations

- **Maximum 3 input images** recommended for optimal performance
- **English, Spanish (Mexico), Japanese, Mandarin, Hindi** - best performance
- **Safety filters**: Content may be blocked (check `finishReason: "SAFETY"`)
- **No guarantees**: Model won't always follow exact instructions
- **Token cost**: 1290 tokens per generated image (all aspect ratios)

### Best Practices

1. **Be Hyper-Specific**: Detailed descriptions > keyword lists
2. **Provide Context**: Explain the image purpose
3. **Use Iteration**: Leverage conversational refinement
4. **Control Composition**: Use photographic terminology (wide-angle, macro shot, etc.)
5. **Avoid Negative Prompts**: Describe desired states positively

---

## Gemini Files API

### Overview

The Files API allows uploading media files separately from prompts, enabling:

- **Reuse**: Reference the same image across multiple requests
- **Larger files**: Support for files up to 2GB
- **Better performance**: Potentially more reliable than inline base64

### Upload Method

```typescript
import { uploadImagesToGemini } from '@/lib/gemini-files';

const uploadedFiles = await uploadImagesToGemini([
  {
    base64: avatarBase64,
    mimeType: 'image/jpeg',
    role: 'avatar',
    displayName: 'Avatar',
  },
  {
    base64: productBase64,
    mimeType: 'image/png',
    role: 'top',
    displayName: 'Shirt',
  },
]);
```

### Using Files in Prompts

```typescript
const promptParts = [
  { text: "Your prompt here" },
  ...uploadedFiles.map(file => ({
    fileData: {
      mimeType: file.mimeType,
      fileUri: file.uri,
    },
  })),
];

const response = await genAI.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: promptParts,
});
```

### File Lifecycle

- **Upload**: Immediate, files usually available right away
- **State**: `PROCESSING` → `ACTIVE` (ready) or `FAILED`
- **Expiration**: 48 hours after upload
- **Storage Limit**: 20GB per project

### When to Use Files API

✅ **Use Files API when**:
- Files > 20MB
- Reusing images across multiple requests
- Better reliability is needed

❌ **Use inline data when**:
- Quick one-off generations
- Small images (<10MB)
- Simplicity is preferred

### Implementation Toggle

Set environment variable to enable:

```bash
GEMINI_USE_FILES_API=true
```

---

## Gemini Image Understanding

### Sending Images

Two methods:

1. **Inline Data**: Base64-encoded images in request
2. **Files API**: Upload first, reference by URI

### Supported Formats

- PNG (`image/png`)
- JPEG (`image/jpeg`)
- WEBP (`image/webp`)
- HEIC (`image/heic`)
- HEIF (`image/heif`)

### Multi-Image Prompts

**Best Practice**: Place text prompt **after** the image part for single images, but for multi-image virtual try-on, structure matters:

```
[Text describing task]
[Product Image 1]
[Product Image 2]
[Avatar Image - LAST for dimension consistency]
```

### Image Requirements

- **Quality**: Clear, non-blurry images
- **Orientation**: Correctly rotated
- **Size**: Under 20MB total request (inline) or 2GB per file (Files API)

---

## BAML Programming Language

### Overview

**BAML** (Basically a Made-up Language) is an open-source DSL that transforms prompts into structured functions with typed inputs and outputs.

### Key Features

1. **Prompts as Functions**: Define prompts with typed parameters and return types
2. **Structured Outputs**: State-of-the-art structured extraction (even outperforms OpenAI's tools)
3. **Cross-Language Support**: Python, TypeScript, Ruby, Java, C#, Rust, Go
4. **Type Safety**: Full type checking and autocomplete
5. **Multimodal Support**: Native image handling via URL, base64, or file paths
6. **Testing Infrastructure**: Built-in tools for testing LLM functions
7. **Model Flexibility**: Switch between 100+ LLM providers with one line

### Syntax Example

```baml
function GenerateVirtualTryOn(
  avatar: Image,
  clothing: Image[],
  style: "casual" | "formal"
) -> GeneratedLook {
  client "openai/gpt-4o"

  prompt #"
    You are a virtual fashion stylist.

    Create a photorealistic image showing the person wearing the clothing items.

    Avatar: {{ avatar }}
    {% for item in clothing %}
    Clothing {{ loop.index }}: {{ item }}
    {% endfor %}

    Style: {{ style }}

    {{ ctx.output_format }}
  "#
}

class GeneratedLook {
  image_url string
  description string
}
```

### Benefits for Our Use Case

1. **Type Safety**: Catch errors at compile time
2. **Testability**: Write unit tests for prompts
3. **Maintainability**: Prompts as code, version controlled
4. **Flexibility**: Easy to swap AI providers
5. **Validation**: Automatic input/output validation

### Considerations

- **Pros**: Much better developer experience, type safety, testability
- **Cons**: Adds new dependency, learning curve, migration effort

### Recommendation

**Future Enhancement**: Consider BAML for v2 of the virtual try-on feature once the current implementation is stable. The benefits (type safety, testability) would significantly improve maintainability as the feature grows.

---

## Implementation Details

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Frontend: bottom-actions.tsx                            │
│   - Collects outfit + avatar                            │
│   - Extracts product metadata (category/role)           │
│   - Sends to /api/studio/generate-look                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│ Backend: /api/studio/generate-look/route.ts            │
│   1. Validate auth                                       │
│   2. Parse request (supports legacy + new format)       │
│   3. Fetch images from URLs → base64                    │
│   4. [Optional] Upload to Files API                     │
│   5. Build labeled prompt                               │
│   6. Call Gemini API                                    │
│   7. Enhanced response validation                       │
│   8. Return generated image or error                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│ Gemini Files API (optional)                             │
│   - Upload images → URIs                                 │
│   - 48-hour expiration                                   │
└─────────────────────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│ Gemini Image Generation API                             │
│   - Model: gemini-2.5-flash-image                        │
│   - Multi-image composition                             │
│   - Returns base64 image                                │
└─────────────────────────────────────────────────────────┘
```

### Request Format

#### Legacy (backward compatible)

```json
{
  "avatarUrl": "https://...",
  "productUrls": [
    "https://...",
    "https://..."
  ]
}
```

#### New Format (with metadata)

```json
{
  "avatarUrl": "https://...",
  "products": [
    {
      "url": "https://...",
      "category": "shirt",
      "role": "top"
    },
    {
      "url": "https://...",
      "category": "pants",
      "role": "bottom"
    }
  ]
}
```

### Prompt Structure

The prompt now includes labeled images:

```
You are an expert virtual fashion stylist performing a precise virtual try-on task.

INPUT IMAGES (in order):
1. SHIRT
2. PANTS
3. SHOES
4. AVATAR (the person to dress)

TASK:
Create a photorealistic image showing the person in image 4 (the avatar)
wearing ALL the clothing items from images 1-3.

CRITICAL REQUIREMENTS:
1. PRESERVE THE PERSON: Keep the avatar's exact face, features, pose UNCHANGED
2. CLOTHING ACCURACY: Use the exact items shown
3. NATURAL FIT: Make clothing fit naturally
4. LAYERING: Layer items appropriately
5. LIGHTING & REALISM: Match avatar's lighting
6. BACKGROUND: Keep original background
7. QUALITY: Photorealistic, high detail
8. DIMENSIONS: Match avatar's aspect ratio

OUTPUT: A single photorealistic image.
```

### Error Handling

#### Response Validation Checks

1. **Null response**: API returned nothing
2. **Error field**: API returned explicit error
3. **Safety block**: `finishReason === "SAFETY"`
4. **Missing candidates**: Invalid response structure
5. **Missing image data**: Response has no `inlineData.data`

#### Logging

All errors and response structures logged to:

- **Console**: Detailed structured logs
- **Debug folder**: `debug-logs/studio-generation/[timestamp]/`
  - `avatar.{ext}` - Avatar image
  - `1.{ext}`, `2.{ext}`, ... - Product images
  - `prompt.txt` - Full prompt text

### Files Created/Modified

#### New Files

- ✅ `lib/gemini-files.ts` - Files API utilities
- ✅ `docs/virtual-tryon-research.md` - This document

#### Modified Files

- ✅ `app/api/studio/generate-look/route.ts` - Main API endpoint
- ✅ `components/artifact/studio/bottom-actions.tsx` - Frontend request
- ✅ `.gitignore` - Added `debug-logs/`

---

## Best Practices

### Prompt Engineering

1. **Be Specific**: Detailed descriptions work better than keywords
2. **Label Images**: Use numbered labels (1. SHIRT, 2. PANTS, 3. AVATAR)
3. **Preserve Identity**: Explicitly instruct to maintain person's features
4. **Natural Language**: Write clear, human-readable instructions
5. **Positive Framing**: Describe what you want, not what you don't want

### Performance

1. **Limit Images**: Max 3 input images + 1 avatar = 4 total
2. **Optimize Size**: Resize images before uploading if possible
3. **Use Files API**: For repeated generations with same images
4. **Timeout**: Set reasonable timeout (30s default)

### Error Handling

1. **Log Everything**: Full response structure for debugging
2. **Save Debug Data**: Images + prompts to disk
3. **Graceful Fallback**: Return avatar if generation fails
4. **User Feedback**: Clear error messages to users

### Testing

1. **Test Different Combinations**: 1-6 products
2. **Test Edge Cases**: Large images, unsupported formats
3. **Test Safety Filters**: Potentially blocked content
4. **Monitor Logs**: Check debug-logs/ after each generation

---

## Troubleshooting

### Issue: "No generated image in response"

**Symptoms**: Avatar returned instead of generated image

**Possible Causes**:

1. **API Response Structure Changed**: Check console logs for response structure
2. **Safety Filters**: Content blocked - check `finishReason`
3. **Model Error**: Model couldn't generate - check full response
4. **Network Issue**: Request timed out or failed

**Solutions**:

1. Check `debug-logs/` for full request/response
2. Review console logs for response structure
3. Try simpler prompt or different images
4. Check Gemini API status

### Issue: Safety Filters Blocking Content

**Symptoms**: `finishReason: "SAFETY"`

**Solutions**:

1. Review images for policy violations
2. Adjust prompt to be more professional
3. Use different avatar or clothing images
4. Check `safetyRatings` for specific issues

### Issue: Generation Taking Too Long

**Symptoms**: Timeout error after 30s

**Solutions**:

1. Reduce number of images
2. Resize images to smaller size
3. Increase timeout in `GENERATION_TIMEOUT_MS`
4. Try Files API instead of inline data

### Issue: Files API Upload Failing

**Symptoms**: Falls back to inline data

**Solutions**:

1. Check `GEMINI_API_KEY` is valid
2. Verify image size < 2GB
3. Check network connectivity
4. Review file format (PNG, JPEG, WEBP only)

---

## Future Improvements

### Short Term (1-2 weeks)

1. **Monitor Success Rate**: Track % of successful generations
2. **A/B Test Prompts**: Compare different prompt structures
3. **User Feedback**: Collect ratings on generated images
4. **Performance Metrics**: Track generation time, error rates

### Medium Term (1-2 months)

1. **BAML Integration**: Migrate to type-safe prompt functions
2. **Prompt Versioning**: Track prompt performance over time
3. **Image Preprocessing**: Auto-crop, resize, enhance images
4. **Caching**: Cache successful generations
5. **Batch Processing**: Generate multiple variations

### Long Term (3-6 months)

1. **Custom Model**: Fine-tune Gemini for virtual try-on
2. **Real-time Preview**: Show partial results during generation
3. **Style Transfer**: Add artistic styles to generated images
4. **AR Integration**: Mobile AR try-on experience
5. **Video Generation**: Animated outfit showcases

---

## References

### Official Documentation

- [Gemini Image Generation API](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini Image Understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Gemini Files API](https://ai.google.dev/api/files)
- [BAML Documentation](https://docs.boundaryml.com/home)

### Community Resources

- [Gemini Cookbook - File API](https://github.com/google-gemini/cookbook/blob/main/quickstarts/File_API.ipynb)
- [BAML GitHub](https://github.com/BoundaryML/baml)
- [BAML Images to Structured Data](https://medium.com/@_jalakoo_/images-to-structured-data-with-baml-19adc3ea9135)

### Implementation Files

- `app/api/studio/generate-look/route.ts` - Main API endpoint
- `lib/gemini-files.ts` - Files API utilities
- `components/artifact/studio/bottom-actions.tsx` - Frontend integration
- `types/studio.ts` - TypeScript types

---

## Appendix: Environment Variables

```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional - Enable Files API (default: false)
GEMINI_USE_FILES_API=true

# Optional - Adjust timeout (default: 30000ms)
# Note: Must be set in code constant GENERATION_TIMEOUT_MS
```

---

**Last Updated**: 2025-10-20
**Next Review**: 2025-11-20
**Maintainer**: Development Team
