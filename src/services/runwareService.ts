
export interface RunwareGenerationParams {
  positivePrompt: string;
  model?: string;
  width?: number;
  height?: number;
  numberResults?: number;
  outputFormat?: string;
  CFGScale?: number;
  scheduler?: string;
  strength?: number;
  seed?: number;
}

export interface RunwareGeneratedImage {
  imageURL: string;
  positivePrompt: string;
  seed: number;
  NSFWContent: boolean;
  cost: number;
}

export class RunwareService {
  private apiKey: string;
  private apiUrl = 'https://api.runware.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(params: RunwareGenerationParams): Promise<RunwareGeneratedImage> {
    const requestBody = [
      {
        taskType: "authentication",
        apiKey: this.apiKey
      },
      {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        positivePrompt: params.positivePrompt,
        model: params.model || "runware:100@1",
        width: params.width || 1024,
        height: params.height || 1024,
        numberResults: params.numberResults || 1,
        outputFormat: params.outputFormat || "WEBP",
        CFGScale: params.CFGScale || 1,
        scheduler: params.scheduler || "FlowMatchEulerDiscreteScheduler",
        strength: params.strength || 0.8,
        ...(params.seed && { seed: params.seed })
      }
    ];

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Runware API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error || result.errors) {
      throw new Error(result.errorMessage || result.errors?.[0]?.message || 'Runware API error');
    }

    // Find the image inference result
    const imageResult = result.data.find((item: any) => item.taskType === 'imageInference');
    
    if (!imageResult) {
      throw new Error('No image result found in response');
    }

    return imageResult;
  }
}
