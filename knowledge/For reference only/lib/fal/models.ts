
// Map of model identifiers to their FAL model IDs
export const FAL_MODELS = {
  "fal-ai/imagen4": "fal-ai/imagen4/preview",
  "fal-ai/imagen4/preview": "fal-ai/imagen4/preview", // Add direct mapping to support both versions
  "fal-ai/fast-sdxl": "fal-ai/fast-sdxl",
  "fal-ai/sd-turbo": "fal-ai/sd-turbo"
} as const;

export type FalModelId = keyof typeof FAL_MODELS;

export function getFalModelId(model: string): string {
  return FAL_MODELS[model as FalModelId] || model;
}

export function isFalModel(model: string): model is FalModelId {
  return model in FAL_MODELS;
}

export function getModelCost(modelId: string): number {
  return modelId === "fal-ai/imagen4/preview" ? 0.003 : 0.002;
}

export function getDefaultSteps(modelId: string): number {
  return modelId === "fal-ai/sd-turbo" ? 1 : 25;
}

export function getDefaultGuidanceScale(modelId: string): number {
  return modelId === "fal-ai/sd-turbo" ? 0.0 : 7;
}
