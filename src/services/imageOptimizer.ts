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
    // Dynamically import the WASM build of sharp so that bundle size stays small
    const { default: sharp } = (await import(/* @vite-ignore */ "@webassembly/sharp")) as any;

    // Convert blob -> Uint8Array buffer that sharp accepts
    const inputBuffer = new Uint8Array(await input.arrayBuffer());

    // Resize & convert to WebP
    const outputBuffer: Uint8Array = await sharp(inputBuffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 90, effort: 6 })
      .toBuffer();

    const optimizedBlob = new Blob([outputBuffer], { type: "image/webp" });
    
    return {
      original: originalBlob,
      optimized: optimizedBlob,
      originalSize: originalSize,
      optimizedSize: optimizedBlob.size
    };
  } catch (err) {
    console.error("[optimiseToWebP1024] optimization failed:", err);
    throw new Error("Image optimization failed");
  }
};
