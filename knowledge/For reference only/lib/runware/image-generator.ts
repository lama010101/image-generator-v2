
import { logError, logInfo } from "@/lib/logger";
import type { GenerateImageParams } from "./types";
import { buildPositivePrompt, validateBaseModel } from "./validation";
import { safeString } from "@/lib/runImagePipeline";

const RUNWARE_ENDPOINT = "https://api.runware.ai/v1";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // ms

/**
 * Standard image generation - routes to appropriate provider based on model
 */
export async function generateImage(
  params: GenerateImageParams,
  taskUUID: string,
  apiKey: string,
): Promise<string> {
  try {
    // Check if we're using a FAL model - if so, throw error as this should be handled by falService
    if (params.model && params.model.startsWith('fal-ai/')) {
      const errorMsg = "FAL models should be handled by the FAL service, not the Runware image generator";
      logError(errorMsg, { details: { model: params.model } });
      throw new Error(errorMsg);
    }

    if (!apiKey) {
      const errorMsg = "No Runware API key provided. Please update your settings.";
      logError(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate and sanitize inputs
    try {
      // Use safeString to ensure we never send objects
      const rawPrompt = safeString(params.positivePrompt);
      const positivePrompt = buildPositivePrompt(rawPrompt);
      
      // Use default model if invalid
      let model = "rundiffusion:130@100"; // Default model
      if (params.model) {
        try {
          model = validateBaseModel(params.model);
        } catch (error) {
          logError("Invalid model, using default", { details: { providedModel: params.model } });
        }
      }
      
      // Create the tasks array with the image inference task
      const tasks = [{
        taskType: 'imageInference',
        taskUUID,
        positivePrompt,
        // Only include negativePrompt if it's not empty and has at least 2 characters
        ...(params.negativePrompt && String(params.negativePrompt).trim().length >= 2 && {
          negativePrompt: safeString(params.negativePrompt).trim()
        }),
        model,
        width: params.width || 1024,
        height: params.height || 1024,
        steps: params.steps || 35,
        CFGScale: params.CFGScale || 15,
        numberResults: params.numberResults || 1,
        outputFormat: params.outputFormat || "WEBP",
        outputType: "URL"
      }];

      logInfo("Generating image with Runware...", { 
        details: { 
          params, 
          taskUUID, 
          endpoint: RUNWARE_ENDPOINT, 
          actualPrompt: positivePrompt 
        } 
      });

      // Implement retry mechanism with exponential backoff
      let response;
      let retries = 0;
      let lastError;

      while (retries <= MAX_RETRIES) {
        try {
          if (retries > 0) {
            logInfo(`Runware API retry attempt ${retries}/${MAX_RETRIES}`);
          }

          response = await fetch(RUNWARE_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(tasks)
          });
          
          // If response is ok or it's a 4xx error, don't retry (only retry on network errors and 5xx)
          if (response.ok || (response.status >= 400 && response.status < 500)) {
            break;
          }

          // For 5xx server errors, retry
          if (response.status >= 500) {
            lastError = new Error(`Server error: ${response.status}`);
            retries++;
            
            if (retries > MAX_RETRIES) {
              break;
            }
            
            // Exponential backoff with jitter
            const backoff = INITIAL_BACKOFF * Math.pow(2, retries - 1) * (0.8 + Math.random() * 0.4);
            logInfo(`Runware server error ${response.status}, retrying in ${Math.round(backoff)}ms`);
            
            await new Promise(resolve => setTimeout(resolve, backoff));
          } else {
            break; // Don't retry other status codes
          }
        } catch (error) {
          // Network errors
          lastError = error;
          retries++;
          
          if (retries > MAX_RETRIES) {
            break;
          }
          
          // Exponential backoff with jitter
          const backoff = INITIAL_BACKOFF * Math.pow(2, retries - 1) * (0.8 + Math.random() * 0.4);
          logError(`Runware fetch error, retrying in ${Math.round(backoff)}ms`, { 
            details: { 
              error: error instanceof Error ? error.message : String(error), 
              retries 
            } 
          });
          
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
      
      // If we exhausted all retries and still have no valid response
      if (!response) {
        const errorMsg = lastError ? `Network error after ${MAX_RETRIES} retries: ${lastError instanceof Error ? lastError.message : String(lastError)}` : 
                                      `Failed to connect to Runware API after ${MAX_RETRIES} retries`;
        logError(errorMsg, { details: { lastError: lastError instanceof Error ? lastError.message : String(lastError) } });
        throw new Error(errorMsg);
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `Server returned ${response.status}: ${response.statusText}` };
        }
        
        // Check for specific error about ControlNet models
        const errorMessage = errorData.errors?.[0]?.message || 
                             errorData.message || 
                             `Failed to generate image with Runware (${response.status})`;
        
        const errorCode = errorData.errors?.[0]?.code || errorData.code;
        
        // Log detailed error information
        logError(errorMessage, { 
          details: { 
            ...errorData, 
            errorCode 
          } 
        });
        
        // Provide more user-friendly error message for specific error codes
        if (errorCode === 'invalidModelIsControlNet') {
          throw new Error("The selected model is a ControlNet model and cannot be used as a base model. Please select a valid base model.");
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !data.data || !data.data[0] || !data.data[0].imageURL) {
        const errorMsg = "Invalid response from Runware: Missing image URL";
        logError(errorMsg, { details: { data } });
        throw new Error(errorMsg);
      }

      const imageURL = data.data[0].imageURL;
      
      logInfo("Image generated successfully with Runware", { 
        details: { 
          imageURL, 
          taskUUID 
        } 
      });

      return imageURL;
    } catch (validationError: any) {
      const errorMsg = `Validation error: ${validationError.message}`;
      logError(errorMsg, { details: { error: validationError.message } });
      throw validationError;
    }
  } catch (error: any) {
    const errorMsg = `Error generating image with Runware: ${error.message}`;
    logError(errorMsg, { details: { error: error.message } });
    throw error;
  }
}
