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
  seedImage?: string;
  maskImage?: string;
  outpaint?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  referenceImages?: string[];
  /** Desired image output format. Defaults to 'jpg' */
  imageType?: 'webp' | 'png' | 'jpg';
}

interface RunwareGenerateResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

type BflWorkflow =
  | "text-to-image"
  | "inpainting"
  | "outpainting"
  | "controlnet"
  | "depth"
  | "reference";

interface BflModelConfig {
  workflow: BflWorkflow;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultSteps?: number;
  providerSettings?: {
    promptUpsampling?: boolean;
    safetyTolerance?: number;
    raw?: boolean;
  };
  supportsDimensions?: boolean;
  supportsCfgScale?: boolean;
  supportsSteps?: boolean;
  requiresSeedImage?: boolean;
  requiresMaskImage?: boolean;
  requiresOutpaint?: boolean;
}

const BFL_MODEL_CONFIGS: Record<string, BflModelConfig> = {
  "bfl:1@1": {
    workflow: "text-to-image",
    defaultWidth: 1024,
    defaultHeight: 1024,
    defaultSteps: 40,
    providerSettings: { promptUpsampling: true, safetyTolerance: 2 },
    supportsDimensions: true,
    supportsCfgScale: true,
    supportsSteps: true,
  },
  "bfl:2@1": {
    workflow: "text-to-image",
    defaultWidth: 1280,
    defaultHeight: 720,
    providerSettings: { promptUpsampling: false, safetyTolerance: 2 },
    supportsDimensions: true,
    supportsCfgScale: false,
    supportsSteps: false,
  },
  "bfl:2@2": {
    workflow: "text-to-image",
    defaultWidth: 2752,
    defaultHeight: 1536,
    providerSettings: { promptUpsampling: true, safetyTolerance: 2, raw: true },
    supportsDimensions: true,
    supportsCfgScale: false,
    supportsSteps: false,
  },
  "bfl:3@1": {
    workflow: "reference",
    defaultWidth: 1392,
    defaultHeight: 752,
    providerSettings: { promptUpsampling: false, safetyTolerance: 2 },
    supportsDimensions: true,
    supportsCfgScale: false,
    supportsSteps: false,
  },
  "bfl:4@1": {
    workflow: "reference",
    defaultWidth: 1024,
    defaultHeight: 1024,
    providerSettings: { promptUpsampling: true, safetyTolerance: 2 },
    supportsDimensions: true,
    supportsCfgScale: false,
    supportsSteps: false,
  },
};

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
    const modelKey = model.toLowerCase();
    const isBflModel = modelKey.startsWith("bfl");
    const bflConfig = isBflModel ? BFL_MODEL_CONFIGS[modelKey] : undefined;

    if (isBflModel && !bflConfig) {
      return {
        success: false,
        error: `Unsupported BFL model configuration: ${model}`
      };
    }

    if (bflConfig?.requiresSeedImage && !req.seedImage) {
      return {
        success: false,
        error: `${model} requires a seed image. Please provide one before generating.`
      };
    }

    if (bflConfig?.requiresMaskImage && !req.maskImage) {
      return {
        success: false,
        error: `${model} requires a mask image (inpainting workflow). Please provide one before generating.`
      };
    }

    if (bflConfig?.requiresOutpaint && !req.outpaint) {
      return {
        success: false,
        error: `${model} requires outpaint dimensions. Please supply the outpaint configuration before generating.`
      };
    }

    const defaultWidth = bflConfig?.defaultWidth ?? 1344;
    const defaultHeight = bflConfig?.defaultHeight ?? 576;

    const width = sanitizeDimension(req.width, defaultWidth);
    const height = sanitizeDimension(req.height, defaultHeight);

    const supportsDimensions = !isBflModel || bflConfig?.supportsDimensions !== false;
    const supportsCfgScale = !isBflModel || bflConfig?.supportsCfgScale === true;
    const supportsSteps = !isBflModel || bflConfig?.supportsSteps === true;

    const steps = supportsSteps
      ? sanitizePositiveNumber(req.steps, bflConfig?.defaultSteps ?? 20)
      : undefined;

    const cfgScale = supportsCfgScale
      ? sanitizePositiveNumber(req.cfgScale, 4)
      : undefined;
    const negativePrompt = req.negative_prompt?.trim();

    const format = req.imageType?.toLowerCase();
    const outputFormat = format === "png" ? "PNG" : format === "jpg" ? "JPG" : undefined;

    let providerSettings: Record<string, Record<string, unknown>> | undefined;

    if (isBflModel) {
      const preset = bflConfig?.providerSettings ?? { safetyTolerance: 2 };
      const cleanedPreset = Object.fromEntries(
        Object.entries(preset).filter(([, value]) => value !== undefined)
      );
      providerSettings = { bfl: cleanedPreset };
    }

    const task: Record<string, unknown> = {
      taskType: "imageInference",
      taskUUID: crypto.randomUUID(),
      positivePrompt: req.prompt,
      outputType: "URL",
      model,
      numberResults: 1
    };

    if (supportsDimensions) {
      task.width = width;
      task.height = height;
    }

    if (steps !== undefined) {
      task.steps = steps;
    }

    if (negativePrompt) {
      task.negative_prompt = negativePrompt;
    }

    if (cfgScale !== undefined) {
      task.CFGScale = cfgScale;
    }

    if (outputFormat) {
      task.outputFormat = outputFormat;
    }

    if (isBflModel && req.seedImage) {
      task.seedImage = req.seedImage;
    }

    if (isBflModel && req.maskImage) {
      task.maskImage = req.maskImage;
    }

    if (isBflModel && req.outpaint) {
      task.outpaint = req.outpaint;
    }

    if (isBflModel && req.referenceImages?.length) {
      task.referenceImages = req.referenceImages;
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
