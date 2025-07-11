
import type { FalGenerateImageParams } from './types';

import { logInfo } from "@/lib/logger";

export function buildImagen4Payload(params: FalGenerateImageParams): any {
  // Calculate aspect ratio from width and height if provided
  let aspectRatio = "4:3"; // Default to 4:3 if no dimensions provided
  
  if (params.width && params.height) {
    const ratio = params.width / params.height;
    logInfo(`Calculating aspect ratio for Imagen4: width=${params.width}, height=${params.height}, ratio=${ratio.toFixed(2)}`);
    
    // Map the calculated ratio to the closest supported aspect ratio
    if (ratio >= 0.99 && ratio <= 1.01) {
      aspectRatio = "1:1";
    } else if (ratio >= 1.32 && ratio <= 1.34) { // ~4:3 ratio
      aspectRatio = "4:3";
    } else if (ratio >= 1.77 && ratio <= 1.78) { // ~16:9 ratio
      aspectRatio = "16:9";
    } else if (ratio >= 0.74 && ratio <= 0.76) { // ~3:4 ratio
      aspectRatio = "3:4";
    } else if (ratio >= 0.56 && ratio <= 0.57) { // ~9:16 ratio
      aspectRatio = "9:16";
    } else {
      // If the ratio doesn't match any standard, default to 4:3
      aspectRatio = "4:3";
      logInfo(`Ratio ${ratio.toFixed(2)} didn't match any standard aspect ratio, defaulting to 4:3`);
    }
  } else {
    logInfo("No width/height provided for Imagen4, using default 4:3 aspect ratio");
  }
  
  const payload: any = {
    prompt: params.prompt,
    aspect_ratio: aspectRatio,
    safety_tolerance: 2, // Required parameter (1-6)
    format: "png" // Optional, defaults to png
  };
  
  // Add optional parameters only if provided
  if (params.negative_prompt) {
    payload.negative_prompt = params.negative_prompt;
  }
  
  logInfo(`Final Imagen4 payload aspect ratio: ${aspectRatio}, model: ${params.model || 'fal-ai/imagen4'}`);
  
  return payload;
}

export function buildFastSdxlPayload(params: FalGenerateImageParams): any {
  const payload: any = {
    prompt: params.prompt,
    image_size: "square_hd", // or "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"
    num_inference_steps: params.steps || 25,
    guidance_scale: params.guidance_scale || 7.5,
    num_images: params.num_images || 1,
    enable_safety_checker: true
  };
  
  if (params.negative_prompt) {
    payload.negative_prompt = params.negative_prompt;
  }
  
  return payload;
}

export function buildSdTurboPayload(params: FalGenerateImageParams): any {
  const payload: any = {
    prompt: params.prompt,
    image_size: "square_hd",
    num_inference_steps: params.steps || 1, // SD Turbo typically uses 1-4 steps
    guidance_scale: params.guidance_scale || 0.0, // SD Turbo typically uses 0.0
    num_images: params.num_images || 1,
    enable_safety_checker: true
  };
  
  if (params.negative_prompt) {
    payload.negative_prompt = params.negative_prompt;
  }
  
  return payload;
}

export function buildFallbackPayload(params: FalGenerateImageParams): any {
  return {
    prompt: params.prompt,
    negative_prompt: params.negative_prompt || "",
    num_images: params.num_images || 1,
    guidance_scale: params.guidance_scale || 7
  };
}

export function buildPayloadForModel(modelId: string, params: FalGenerateImageParams): any {
  // Log the model ID to help with debugging
  logInfo(`Building payload for FAL model: ${modelId}`, { details: { originalModel: params.model } });
  
  switch (modelId) {
    case "fal-ai/imagen4":
    case "fal-ai/imagen4/preview":
      logInfo("Using Imagen 4 payload builder");
      return buildImagen4Payload(params);
    case "fal-ai/fast-sdxl":
      return buildFastSdxlPayload(params);
    case "fal-ai/sd-turbo":
      return buildSdTurboPayload(params);
    default:
      return buildFallbackPayload(params);
  }
}
