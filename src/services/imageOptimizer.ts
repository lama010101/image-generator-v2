interface OptimizationResult {
  original: Blob;
  optimized: Blob;
  optimizedSize: number;
  originalSize: number;
}

/**
 * Optimise an image Blob to WebP 1024 px wide using Sharp (WASM build).
 * Returns both original and optimized versions for storage.
 * Throws an error if optimization fails (no fallback to original).
 */
export const optimiseToWebP1024 = async (input: Blob): Promise<OptimizationResult> => {
  // Store original blob and its size
  const originalBlob = input;
  const originalSize = originalBlob.size;

  try {
    // Create an ImageBitmap from the input Blob (works in modern browsers)
    const bitmap = await createImageBitmap(input);

    // Calculate new dimensions (max width 1024px, preserve aspect ratio, never enlarge)
    const scale = Math.min(1024 / bitmap.width, 1);
    const targetWidth = Math.round(bitmap.width * scale);
    const targetHeight = Math.round(bitmap.height * scale);

    // Draw onto an off-screen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot acquire 2D context for image optimisation');
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    // Encode to WebP (quality 0.9). If browser doesn’t support WebP encoding, this may return null.
    const optimizedBlob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob() returned null – WebP may be unsupported'));
        },
        'image/webp',
        0.9
      );
    });

    return {
      original: originalBlob,
      optimized: optimizedBlob,
      originalSize,
      optimizedSize: optimizedBlob.size,
    };
  } catch (error) {
    console.warn('[optimiseToWebP1024] optimisation failed, falling back to original:', error);
    // Rethrow so calling code can decide whether to continue with original.
    throw error;
  }
};
