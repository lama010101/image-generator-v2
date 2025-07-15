// @ts-nocheck
// Deprecated: use falServiceQueue.ts
export * from "./falServiceQueue";
/* Legacy implementation below is disabled to reduce bundle size and fix TypeScript errors.
import axios from "axios";
import { settings } from "@/lib/settings";

export interface FalGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  /** Aspect ratio accepted by the model, defaults to "1:1" */
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "3:4" | "4:3";
  /** size as "WIDTHxHEIGHT"; only for endpoints that support it */
  image_size?: string;
  /** Fully qualified model path, e.g. fal-ai/imagen4/preview */
  model?: string;
}

export interface FalGenerateResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate an image using Fal.ai via the official `@fal-ai/client` which handles
 * the queue and polling internally.
 */
export const generateImageFal = async (
  req: FalGenerateRequest
): Promise<FalGenerateResponse> => {
  const apiKey = settings.VITE_FAL_API_KEY;
  if (!apiKey) {
    return { success: false, error: "FAL API key is missing." };
  }

  const modelPath = req.model ?? "fal-ai/imagen4/preview";

  try {
    // Dynamic import to avoid adding the client to the main bundle unless used
    const { fal } = await import("@fal-ai/client");
    fal.config({ credentials: apiKey });

    const result: any = await fal.subscribe(modelPath, {
      input: {
        prompt: req.prompt,
        negative_prompt: req.negative_prompt ?? "",
        aspect_ratio: req.aspect_ratio ?? "1:1",
        num_images: 1,
        // image_size not supported by every model; include only if provided
        ...(req.image_size ? { image_size: req.image_size } : {}),
      },
    });

    let imageUrl: string | undefined;
    if (Array.isArray(result.images)) {
      if (Array.isArray(result.images[0])) {
        imageUrl = result.images[0][0]?.url;
      } else {
        imageUrl = result.images[0]?.url;
      }
    }

    if (!imageUrl) {
      return { success: false, error: "Fal.ai result missing image URL" };
    }

    return { success: true, imageUrl };
  } catch (err: any) {
    console.error("Fal.ai image generation failed", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
};

export type { FalGenerateRequest, FalGenerateResponse };
