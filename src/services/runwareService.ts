import axios from "axios";
import { settings } from "@/lib/settings";

interface RunwareGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  model?: string;
  steps?: number;
  cfgScale?: number;
  /** Desired image output format. Defaults to 'jpg' */
  imageType?: 'webp' | 'png' | 'jpg';
}

interface RunwareGenerateResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Generate an image using Runware's Image Inference API.
 * Expects the API key to be provided in `VITE_RUNWARE_API_KEY`.
 * For full API details see: https://runware.ai/docs/en/image-inference/api-reference
 */
export const generateImageRunware = async (
  req: RunwareGenerateRequest
): Promise<RunwareGenerateResponse> => {
  const apiKey = settings.VITE_RUNWARE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "RUNWARE API key is missing."
    };
  }

  try {
    // Determine desired output format. Default to JPG if not specified / unsupported.
    const format = (req.imageType ?? 'jpg').toLowerCase();
    const formatUpper = format === 'png' ? 'PNG' : format === 'webp' ? 'WEBP' : 'JPG';

    const payload = [
      {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        positivePrompt: req.prompt,
        negativePrompt: req.negative_prompt || undefined,
        outputType: "URL",
        outputFormat: formatUpper,
        width: req.width ?? 768,
        height: req.height ?? 768,
        steps: req.steps ?? 30,
        CFGScale: req.cfgScale ?? 7,
        model: req.model ?? "runware:101@1",
        numberResults: 1
      }
    ];

    const response = await axios.post(
      "https://api.runware.ai/v1",
      payload,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30_000
      }
    );

    const data = response.data as { data: { imageURL: string }[] };
    const imageURL = data?.data?.[0]?.imageURL;

    if (!imageURL) {
      throw new Error("Runware API response missing imageURL");
    }

    return {
      success: true,
      imageUrl: imageURL
    };
  } catch (error) {
    console.error("Runware image generation failed", error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
};

export type { RunwareGenerateRequest, RunwareGenerateResponse };
