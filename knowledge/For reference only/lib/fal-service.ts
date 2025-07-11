
import { fal } from "@fal-ai/client";
import { loadSettings } from "@/lib/settings";
import { logInfo, logError } from "@/lib/logger";

interface FalImageRequest {
  prompt: string;
  negative_prompt?: string;
  num_images?: number;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  model?: string;
}

interface FalImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

class FalService {
  private apiKey: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const settings = await loadSettings();
      this.apiKey = settings.falApiKey || null;
      
      if (this.apiKey) {
        // Configure FAL client with credentials
        fal.config({
          credentials: this.apiKey
        });
      }
    } catch (error) {
      logError("Failed to initialize FAL service", { 
        details: { 
          error: error instanceof Error ? error.message : String(error) 
        } 
      });
    }
  }

  updateApiKey(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      fal.config({
        credentials: apiKey
      });
    }
  }

  async generateImage(request: FalImageRequest): Promise<any> {
    if (!this.apiKey) {
      throw new Error("FAL API key not configured");
    }

    try {
      logInfo("Generating image with FAL", { details: { model: request.model || 'default' } });

      // Use the model from the request or default to Google's Imagen
      const modelEndpoint = request.model || "fal-ai/google-imagen-3";

      // Use fal.run for sync generation and properly handle the Result type
      const result = await fal.run(modelEndpoint, {
        input: {
          prompt: request.prompt,
          negative_prompt: request.negative_prompt,
          num_images: request.num_images || 1,
          width: request.width || 1024,
          height: request.height || 1024,
          steps: request.steps || 30,
          guidance_scale: request.guidance_scale || 7
        }
      });

      // Extract the data from the Result type and cast to our expected interface
      const responseData = result.data as FalImageResponse;

      if (responseData.images && responseData.images.length > 0) {
        return {
          imageURL: responseData.images[0].url,
          imageUUID: `fal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          width: responseData.images[0].width,
          height: responseData.images[0].height
        };
      }

      throw new Error("No images generated");
    } catch (error: any) {
      logError("FAL image generation failed", { 
        details: { 
          error: error instanceof Error ? error.message : String(error) 
        } 
      });
      throw error;
    }
  }
}

export const falService = new FalService();
