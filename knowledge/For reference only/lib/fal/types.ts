
export interface FalGenerateImageParams {
  prompt: string;
  negative_prompt?: string;
  num_images?: number;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  model?: string;
}

export interface FalGeneratedImage {
  url: string;
  width: number;
  height: number;
}

export interface FalApiResponse {
  images: FalGeneratedImage[];
}

export interface GeneratedImageResult {
  imageURL: string;
  imageUUID: string;
  positivePrompt: string;
  negativePrompt?: string;
  model: string;
  width: number;
  height: number;
  CFGScale: number;
  steps: number;
  scheduler: string;
  seed: number;
  cost: number;
  createdAt: Date;
  readyForProduction: boolean;
  NSFWContent: boolean;
  optimizedImageURL?: string;
  thumbnailImageURL?: string;
}
