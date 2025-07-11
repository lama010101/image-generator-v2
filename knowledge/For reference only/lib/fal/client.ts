
import { fal } from "@fal-ai/client";
import { loadSettings } from "@/lib/settings";
import { logError } from "@/lib/logger";

export class FalClient {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const settings = await loadSettings();
      const apiKey = settings.falApiKey;
      
      if (apiKey) {
        // Use credentials method for FAL client
        fal.config({
          credentials: apiKey
        });
        this.initialized = true;
      }
    } catch (error) {
      logError("Failed to initialize FAL client", { 
        details: { 
          error: error instanceof Error ? error.message : String(error) 
        } 
      });
    }
  }

  async generateImage(params: any) {
    await this.initialize();
    
    if (!this.initialized) {
      throw new Error("FAL client not initialized - API key required");
    }

    const result = await fal.run("fal-ai/google-imagen-3", {
      input: params
    });

    return result.data;
  }
}

export const falClient = new FalClient();
