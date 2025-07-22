/**
 * Service for handling different image formats (WebP, PNG, JPG)
 */

export interface FormatGenerationOptions {
  input: Blob;
  format: 'webp' | 'png' | 'jpg';
  quality?: number;
  maxWidth?: number;
}

export interface FormatGenerationResult {
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

/**
 * Generate an image in the specified format
 */
export const generateImageInFormat = async (
  options: FormatGenerationOptions
): Promise<FormatGenerationResult> => {
  const { input, format, quality = 0.8, maxWidth = 1024 } = options;
  
  const { createImageBitmap } = await import("@/utils/domPolyfills");
  const bitmap = await createImageBitmap(input);
  
  const scale = Math.min(maxWidth / bitmap.width, 1);
  const targetWidth = Math.round(bitmap.width * scale);
  const targetHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot acquire 2D context for image processing");
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  let mimeType: string;
  let fileExtension: string;
  
  switch (format) {
    case 'png':
      mimeType = 'image/png';
      fileExtension = 'png';
      break;
    case 'jpg':
      mimeType = 'image/jpeg';
      fileExtension = 'jpg';
      break;
    case 'webp':
    default:
      mimeType = 'image/webp';
      fileExtension = 'webp';
      break;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`Canvas toBlob() returned null – ${format} unsupported`))),
      mimeType,
      format === 'png' ? undefined : quality
    );
  });

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    size: blob.size,
  };
};

/**
 * Generate variants in different formats and sizes
 */
export interface MultiFormatGenerationResult {
  original: Blob;
  originalSize: number;
  desktop: FormatGenerationResult;
  mobile: FormatGenerationResult;
  thumbnail: FormatGenerationResult;
}

export const generateMultiFormatVariants = async (
  input: Blob,
  format: 'webp' | 'png' | 'jpg' = 'webp'
): Promise<MultiFormatGenerationResult> => {
  const originalSize = input.size;
  
  const [desktop, mobile, thumbnail] = await Promise.all([
    generateImageInFormat({ input, format, maxWidth: 1024, quality: 0.8 }),
    generateImageInFormat({ input, format, maxWidth: 640, quality: 0.7 }),
    generateImageInFormat({ input, format, maxWidth: 300, quality: 0.6 }),
  ]);

  return {
    original: input,
    originalSize,
    desktop,
    mobile,
    thumbnail,
  };
};
