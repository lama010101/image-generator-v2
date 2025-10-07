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
    const sanitizeDimension = (value: number | undefined, fallback: number) => {
      if (typeof value === "number" && Number.isFinite(value) && value >= 64) {
        return value;
      }
      return fallback;
    };

    const sanitizePositiveNumber = (value: number | undefined, fallback: number) => {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
      }
      return fallback;
    };

    const model = req.model ?? "bfl:2@1";
    const width = sanitizeDimension(req.width, 1344);
    const height = sanitizeDimension(req.height, 576);
    const steps = sanitizePositiveNumber(req.steps, 20);
    const cfgScale = sanitizePositiveNumber(req.cfgScale, 4);
    const negativePrompt = req.negative_prompt?.trim();

    const format = req.imageType?.toLowerCase();
    const outputFormat = format === "png" ? "PNG" : format === "jpg" ? "JPG" : undefined;

    const providerSettings = model.toLowerCase().startsWith("bfl")
      ? {
          bfl: {
            promptUpsampling: false,
            safetyTolerance: 2
          }
        }
      : undefined;

    const task: Record<string, unknown> = {
      taskType: "imageInference",
      taskUUID: crypto.randomUUID(),
      positivePrompt: req.prompt,
      outputType: "URL",
      width,
      height,
      steps,
      CFGScale: cfgScale,
      model,
      numberResults: 1
    };

    if (negativePrompt) {
      task.negative_prompt = negativePrompt;
    }

    if (outputFormat) {
      task.outputFormat = outputFormat;
    }

    if (providerSettings) {
      task.providerSettings = providerSettings;
    }

    const payload = [task];

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

    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data as any;
      const detailedMessage =
        responseData?.errors?.[0]?.message ||
        responseData?.message ||
        `Request failed with status code ${error.response.status}`;

      return {
        success: false,
        error: detailedMessage
      };
    }

    return {
      success: false,
      error: (error as Error).message
    };
  }
};

export type { RunwareGenerateRequest, RunwareGenerateResponse };
