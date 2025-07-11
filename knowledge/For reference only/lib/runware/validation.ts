
/**
 * Validation utilities for Runware API requests
 */

/**
 * Validates and formats a positive prompt for Runware API
 * @param value Any input value that should be converted to a valid prompt
 * @returns A validated prompt string
 * @throws Error if the prompt is too short
 */
export function buildPositivePrompt(value: unknown): string {
  // Convert any input to string, trim, and limit to 3000 chars
  const prompt = String(value ?? '').trim().slice(0, 3000);
  
  // Check if prompt meets minimum length requirement
  if (prompt.length < 2) {
    throw new Error('Prompt must be at least 2 characters long');
  }
  
  return prompt;
}

/**
 * Regex for validating AIR identifiers (format: source:id@version)
 */
export const AIR_REGEX = /^[a-zA-Z0-9_-]+:\d+@\d+$/;

/**
 * List of valid FAL model identifiers
 */
export const VALID_FAL_MODELS = [
  'fal-ai/imagen4/preview',
  'fal-ai/fast-sdxl',
  'fal-ai/sd-turbo'
];

/**
 * Validates a model identifier for either Runware AIR or FAL
 * @param modelId The model identifier to validate
 * @returns The validated model ID
 * @throws Error if the model ID format is invalid
 */
export function validateBaseModel(modelId: string): string {
  if (!modelId || typeof modelId !== 'string') {
    throw new Error('Model ID must be provided');
  }
  
  // Check if it's a valid FAL model
  if (modelId.startsWith('fal-ai/')) {
    if (VALID_FAL_MODELS.includes(modelId)) {
      return modelId;
    }
    throw new Error(`Invalid FAL model: ${modelId}. Supported FAL models are: ${VALID_FAL_MODELS.join(', ')}`);
  }
  
  // Otherwise, must be a valid AIR model
  if (!AIR_REGEX.test(modelId)) {
    throw new Error('Invalid model format. Must be in format source:id@version (e.g. rundiffusion:130@100)');
  }
  
  return modelId;
}

/**
 * Interface for ControlNet configuration
 */
export interface ControlNetConfig {
  model: string;
  startStepPercentage?: number;
  endStepPercentage?: number;
  controlMode?: 'prompt' | 'controlnet' | 'balanced';
}

/**
 * Builds a properly formatted request payload for Runware image generation
 */
export function buildRunwareRequestPayload(params: {
  positivePrompt: unknown;
  negativePrompt?: unknown;
  model: string;
  width?: number;
  height?: number;
  steps?: number;
  CFGScale?: number;
  scheduler?: string;
  seed?: number | null;
  outputFormat?: string;
  controlNetModel?: string;
}) {
  // Validate and format the positive prompt
  const positivePrompt = buildPositivePrompt(params.positivePrompt);
  
  // Validate the model ID
  let model: string;
  
  try {
    model = validateBaseModel(params.model);
  } catch (error) {
    // Default to a known working model if the provided one is invalid
    model = "rundiffusion:130@100";
    console.warn(`Invalid model provided: ${params.model}, using default instead`);
  }
  
  // Format negative prompt if provided (optional)
  const negativePrompt = params.negativePrompt ? String(params.negativePrompt).trim() : undefined;
  
  // Base payload
  const payload: any = {
    positivePrompt,
    model,
    width: params.width || 1024,
    height: params.height || 1024,
    steps: params.steps || 35,
    CFGScale: params.CFGScale || 15,
    scheduler: params.scheduler || "FlowMatchEulerDiscreteScheduler",
    outputFormat: params.outputFormat || "WEBP",
    numberResults: 1
  };
  
  // Only add negative prompt if it exists and has content
  if (negativePrompt && negativePrompt.length >= 2) {
    payload.negativePrompt = negativePrompt;
  }
  
  // Add seed if provided
  if (params.seed) {
    payload.seed = params.seed;
  }
  
  // Handle ControlNet model if provided
  if (params.controlNetModel && AIR_REGEX.test(params.controlNetModel)) {
    payload.controlNet = [
      {
        model: params.controlNetModel,
        controlMode: 'balanced'
      } as ControlNetConfig
    ];
  }
  
  return payload;
}
