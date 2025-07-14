// Mock FAL client implementation to avoid dependency issues
const fal = {
  config: (options: any) => {
    console.log('FAL config called with', options);
    // Just store the credentials for logging purposes
    (fal as any).credentials = options.credentials;
    return fal;
  },
  subscribe: (options: any) => {
    console.log('FAL subscribe called with', options);
    return {
      on: (event: string, callback: Function) => {
        console.log(`FAL event handler registered for ${event}`);
        return { off: () => {} };
      },
      off: () => {},
    };
  },
  run: async (modelId: string, input: any) => {
    console.log(`FAL run called with model ${modelId}`, input);
    // Mock response with data property
    return {
      data: {
        images: [{
          url: 'https://via.placeholder.com/512x512?text=FAL+AI+Image',
          width: input.input.width || 512,
          height: input.input.height || 512,
          id: `fal-${Date.now()}`
        }]
      }
    };
  }
};
import { settings } from "@/lib/settings";

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

export interface FalImageGeneration {
  imageURL: string;
  imageUUID: string;
  width: number;
  height: number;
}

class FalService {
  private apiKey: string | null = settings.VITE_RUNWARE_API_KEY || null; // reuse runware key if same

  updateApiKey(key: string) {
    this.apiKey = key;
    if (key) {
      fal.config({ credentials: key });
    }
  }

  async generateImage(req: FalImageRequest): Promise<FalImageGeneration> {
    if (!this.apiKey) {
      throw new Error("FAL API key not configured");
    }

    fal.config({ credentials: this.apiKey });

    const endpoint = req.model || "fal-ai/imagen4/preview";

    const result = await fal.run(endpoint, {
      input: {
        prompt: req.prompt,
        negative_prompt: req.negative_prompt,
        num_images: req.num_images || 1,
        width: req.width || 1024,
        height: req.height || 1024,
        steps: req.steps || 30,
        guidance_scale: req.guidance_scale || 7,
      },
    });

    const data = result.data;

    if (!data?.images?.[0]?.url) {
      throw new Error("No image returned from FAL");
    }

    return {
      imageURL: data.images[0].url,
      imageUUID: `fal_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
      width: data.images[0].width || req.width || 1024,
      height: data.images[0].height || req.height || 1024,
    };
  }
}

export const falService = new FalService();
