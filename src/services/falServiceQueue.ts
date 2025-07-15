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
 * Generate an image using Fal.ai queue REST API with polling.
 * This implementation is browser-friendly and avoids importing the official
 * `@fal-ai/client`, which bundles Node-specific dependencies that break Vite.
 * Docs: https://docs.fal.ai/model-endpoints/queue
 */
export const generateImageFal = async (
  req: FalGenerateRequest
): Promise<FalGenerateResponse> => {
  const apiKey = settings.VITE_FAL_API_KEY;
  if (!apiKey) {
    return { success: false, error: "FAL API key is missing." };
  }

  const modelPath = req.model ?? "fal-ai/imagen4/preview";
  const endpoint = `https://queue.fal.run/${modelPath}`;

  try {
    // Submit generation request
    const submitRes = await axios.post(
      endpoint,
      {
        prompt: req.prompt,
        negative_prompt: req.negative_prompt ?? "",
        aspect_ratio: req.aspect_ratio ?? "1:1",
        ...(req.image_size ? { image_size: req.image_size } : {}),
      },
      {
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30_000,
      }
    );

    let status: string = submitRes.data?.status ?? "IN_QUEUE";
    let statusUrl: string | undefined = submitRes.data?.status_url;
    let resultUrl: string | undefined = submitRes.data?.response_url;

    const poll = async (url: string) => {
      const res = await axios.get(url, {
        headers: { Authorization: `Key ${apiKey}` },
        timeout: 30_000,
      });
      return res.data;
    };

    const start = Date.now();
    const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes
    while (status !== "COMPLETED" && Date.now() - start < MAX_WAIT_MS) {
      await new Promise((r) => setTimeout(r, 2500));
      if (!statusUrl) break;
      const stat = await poll(statusUrl);
      status = stat.status;
      resultUrl = stat.response_url ?? resultUrl;
    }

    if (status !== "COMPLETED" || !resultUrl) {
      return {
        success: false,
        error: `Fal.ai generation not completed (status=${status})`,
      };
    }

    const resultData = await poll(resultUrl);
    const imageUrl: string | undefined =
      resultData?.images?.[0]?.[0]?.url ?? resultData?.images?.[0]?.url;

    if (!imageUrl) {
      return { success: false, error: "Fal.ai result missing image URL" };
    }

    return { success: true, imageUrl };
  } catch (err: any) {
    console.error("Fal.ai image generation failed", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
};

export type { FalGenerateRequest as FalGenerateRequestType, FalGenerateResponse as FalGenerateResponseType };
