/*
 * domPolyfills.ts
 * Lightweight polyfills/helpers for DOM APIs that may be undefined in certain runtimes (e.g. Node / SSR).
 * Currently provides a safe `createImageBitmap` wrapper so that importing code can always rely on the
 * function existing at runtime, while still delegating to the native implementation when available.
 */

// We want the same name export so `import { createImageBitmap } from "@/utils/domPolyfills"` works.
// The polyfill will:
//   1. Use the native browser implementation when present.
//   2. Throw a clear error in non-browser environments to avoid silent failures.

export async function createImageBitmap(blob: Blob): Promise<ImageBitmap> {
  if (typeof window !== "undefined" && typeof (window as any).createImageBitmap === "function") {
    return (window as any).createImageBitmap(blob);
  }

  // Fallback for environments without createImageBitmap, such as JSDOM or Node.
  // We could attempt a canvas-based workaround, but generating ImageBitmap objects
  // in non-browser contexts is generally not required for our use-case (client-side image optimisation).
  // Therefore, surface a clear message so developers know the limitation.
  throw new Error(
    "createImageBitmap is not available in this environment. Image variant generation must run in a modern browser context."
  );
}
