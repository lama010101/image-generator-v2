import { createImageBitmap } from "@/utils/domPolyfills";

/** Information about a generated WebP variant. */
export interface VariantInfo {
  blob: Blob;
  width: number;
  height: number;
  size: number; // bytes
}

/** Result object containing original blob and three WebP variants. */
export interface VariantGenerationResult {
  original: Blob;
  originalSize: number;
  desktop: VariantInfo;
  mobile: VariantInfo;
  thumbnail: VariantInfo;
}

/**
 * Internal helper to resize & encode to WebP.
 */
async function createVariant(
  input: Blob | ImageBitmap,
  maxWidth: number,
  quality: number
): Promise<VariantInfo> {
  const bitmap = input instanceof ImageBitmap ? input : await createImageBitmap(input);
  const scale = Math.min(maxWidth / bitmap.width, 1);
  const targetWidth = Math.round(bitmap.width * scale);
  const targetHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot acquire 2D context for image optimisation");
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob() returned null – WebP unsupported"))),
      "image/webp",
      quality
    );
  });

  return { blob, width: targetWidth, height: targetHeight, size: blob.size };
}

/**
 * Generate desktop (1024px / 80%), mobile (640px / 70%) and thumbnail (300px / 60%)
 * WebP variants for the provided image Blob.
 */
export const generateWebPVariants = async (input: Blob): Promise<VariantGenerationResult> => {
  const originalSize = input.size;
  const bitmap = await createImageBitmap(input);

  const [desktop, mobile, thumbnail] = await Promise.all([
    createVariant(bitmap, 1024, 0.8),
    createVariant(bitmap, 640, 0.7),
    createVariant(bitmap, 300, 0.6),
  ]);

  return {
    original: input,
    originalSize,
    desktop,
    mobile,
    thumbnail,
  };
};
