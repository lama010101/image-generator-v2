import type { GenerateImageParams } from "@/lib/runware/types";
import { v4 as generateUUID } from "uuid";
import { logInfo, logError } from "@/lib/logger";
import { safeString } from "./runImagePipeline";
import { falService } from "./fal-service";
import { generateImage } from "./runware/image-generator";
import { enhancePrompts } from "./runware/prompt-enhancer";
import { buildPositivePrompt, validateBaseModel, AIR_REGEX, VALID_FAL_MODELS } from "./runware/validation";
import type { EnhancedPrompt, GeneratedImage } from "./runware/types";

// Export types that were previously defined in this file
export type { EnhancedPrompt, GeneratedImage } from "./runware/types";

// Create and export a runwareService object
class RunwareService {
  private apiKey: string = "";

  constructor() {
    // API key will be initialized by AppContext calling updateApiKey
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    logInfo(`Runware service API key updated. Key is ${apiKey ? 'set' : 'not set'}.`);
  }

  // Method to validate if a model is allowed for direct use (not ControlNet)
  isValidModel(model: string): boolean {
    if (!model) return false;
    
    // Check if it's a valid FAL model
    if (model.startsWith('fal-ai/')) {
      return VALID_FAL_MODELS.includes(model);
    }
    
    // Check if the model is a control net model (not valid as a base model)
    if (this.isControlNetModel(model)) {
      return false;
    }
    
    // Use the AIR_REGEX pattern to validate the model format
    return AIR_REGEX.test(model);
  }

  // Method to check if a model is a ControlNet model
  isControlNetModel(model: string): boolean {
    if (!model) return false;
    
    // Check for control net model patterns
    const controlNetPatterns = ['runware:20@', 'runware:21@', 'civitai:'];
    return controlNetPatterns.some(prefix => model.startsWith(prefix));
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
    // Check if this is a FAL model - if so, delegate to FAL service
    if (params.model && params.model.startsWith('fal-ai/')) {
      logInfo(`Delegating FAL model ${params.model} to FAL service`);
      
      try {
        const result = await falService.generateImage({
          prompt: safeString(params.positivePrompt),
          negative_prompt: params.negativePrompt ? safeString(params.negativePrompt) : undefined,
          num_images: 1,
          width: params.width || 1024,
          height: params.height || 1024,
          steps: params.steps || 30,
          guidance_scale: params.CFGScale || 7,
          model: params.model // Pass FAL model directly
        });
        
        return {
          imageURL: result.imageURL,
          imageUUID: result.imageUUID || generateUUID(), 
          model: params.model, // Return the FAL model name
          aiGenerated: true,
          width: params.width || 1024,
          height: params.height || 1024,
          positivePrompt: safeString(params.positivePrompt),
          negativePrompt: params.negativePrompt ? safeString(params.negativePrompt) : undefined,
          steps: params.steps || 30,
          CFGScale: params.CFGScale || 7,
          scheduler: "N/A for FAL", // FAL doesn't expose scheduler info
          seed: 0, // FAL doesn't return seed information
          cost: 0.003, // Estimated cost for FAL
          createdAt: new Date(),
          readyForProduction: false,
          NSFWContent: false
        };
      } catch (error: any) {
        logError("Error in FAL image generation", { details: { error: error.message || String(error), model: params.model } });
        throw new Error(`FAL image generation failed: ${error.message || String(error)}`);
      }
    }
    
    // Handle standard Runware models
    // IMPORTANT FIX: Always use the user's explicitly selected model if provided
    // Only use default if no model is provided at all
    const defaultModel = "rundiffusion:130@100";
    let model = params.model || defaultModel;
    let validatedModel = model;
    
    // Try to validate the model, but if validation fails, still use the user's selection
    try {
      validatedModel = validateBaseModel(model);
      // If validation succeeded, use the validated model
      model = validatedModel;
      logInfo(`Model validation succeeded for: ${model}`);
    } catch (error) {
      // Validation failed, but we'll respect the user's choice and still use their model
      logInfo(`Model validation failed for ${model}, but using it anyway as per user selection`);
    }
    
    const taskUUID = generateUUID();
    
    try {
      // Log which model we're actually using
      logInfo(`Generating image with model: ${model}`, { 
        details: {
          originalModel: params.model || "<not provided>", 
          actualModel: model 
        }
      });
      
      const positivePrompt = buildPositivePrompt(params.positivePrompt);
      
      // Clean params for API call
      const cleanedParams = {
        ...params,
        model, // Use the model (user's choice or validated)
        positivePrompt, // Use cleaned prompt
      };
      
      // Generate the image
      const imageURL = await generateImage(cleanedParams, taskUUID, this.apiKey);
      
      return {
        imageURL,
        imageUUID: taskUUID,
        model, // Return the model that was actually used
        aiGenerated: true,
        positivePrompt: params.positivePrompt,
        negativePrompt: params.negativePrompt,
        width: params.width || 1024,
        height: params.height || 1024,
        CFGScale: params.CFGScale || 25,
        steps: params.steps || 35,
        scheduler: params.scheduler || "FlowMatchEulerDiscreteScheduler", 
        seed: params.seed || Math.floor(Math.random() * 1000000000),
        cost: 0.001, // Default cost estimation
        createdAt: new Date(),
        readyForProduction: false,
        NSFWContent: false,
        // Add optimized and thumbnail URLs as undefined initially
        optimizedImageURL: undefined,
        thumbnailImageURL: undefined
      };
    } catch (error: any) {
      logError("Error in generateImage", error);
      throw error;
    }
  }

  async generatePrompts(description: string, numPrompts: number = 3): Promise<EnhancedPrompt[]> {
    if (!this.apiKey) {
      logError("Runware API key not set. Cannot generate prompts.");
      throw new Error("Runware API key is not configured. Please set it in the application settings.");
    }

    // Generate a UUID for the task
    const taskUUID = generateUUID();
    
    try {
      // Validate and sanitize the description
      const validDescription = buildPositivePrompt(description);
      
      // Log the request parameters
      logInfo(`RunwareService.generatePrompts called. Task ID: ${taskUUID}`);
      
      // Call the implementation function with the generated UUID
      return enhancePrompts(validDescription, numPrompts, taskUUID);
    } catch (error: any) {
      logError("Error in generatePrompts", error);
      throw error;
    }
  }
  
  /**
   * Proxies a request to an external API through our backend to avoid CORS issues
   * @param url The URL to fetch from
   * @param options Fetch options
   * @returns The response data
   */
  async proxyFetch(url: string, options?: RequestInit): Promise<any> {
    try {
      // Check if the URL is for the AI Topia extensions
      if (url.includes('extensions.aitopia.ai')) {
        // Transform the URL to use our Vite proxy
        const proxyUrl = url.replace('https://extensions.aitopia.ai', '/extensions');
        
        // Log the proxy request
        logInfo(`RunwareService.proxyFetch called for ${proxyUrl}`, { method: options?.method || 'GET' });
        
        // Make the request through our proxy
        const response = await fetch(proxyUrl, options);
        
        // Check if the response is ok
        if (!response.ok) {
          const errorText = await response.text();
          logError("API request failed", {
            status: response.status,
            url: proxyUrl,
            error: { 
              message: errorText,
              name: "APIResponseError"
            }
          });
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
        
        // Parse and return the response data
        const data = await response.json();
        
        logInfo(`API request to ${proxyUrl} successful`);
        
        return data;
      } else {
        // For other URLs, just pass through
        const response = await fetch(url, options);
        return await response.json();
      }
    } catch (caughtError: any) {
      const baseMessage = `Error in proxyFetch for URL: ${url}`;
      if (caughtError instanceof Error) {
        logError(baseMessage, { 
          error: { 
            message: caughtError.message, 
            name: caughtError.name, 
            stack: caughtError.stack 
          },
          url: url // also log the url in LogOptions
        });
      } else {
        logError(`${baseMessage}: ${String(caughtError)}`, { url: url });
      }
      throw caughtError;
    }
  }
}

// Export the runwareService instance so it can be imported by other files
export const runwareService = new RunwareService();
