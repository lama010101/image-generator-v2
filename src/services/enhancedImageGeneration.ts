
import { supabase } from "@/integrations/supabase/client";
import { RunwareService } from "./runwareService";

export interface GenerationRequest {
  promptId: string;
  prompt: string;
  title?: string;
  description?: string;
}

export interface GenerationResult {
  success: boolean;
  imageId?: string;
  error?: string;
}

// This will use environment variables when available, fallback to demo mode
const getRunwareApiKey = (): string | null => {
  // In a real environment, this would come from environment variables
  // For now, we'll return null to indicate demo mode
  return null;
};

export const generateImageWithRunware = async (request: GenerationRequest): Promise<GenerationResult> => {
  try {
    console.log('Starting image generation for prompt:', request.prompt);
    
    // Generate a valid UUID for user_id since we don't have authentication
    const publicUserId = crypto.randomUUID();
    
    // Step 1: Create image record in database with pending status
    const { data: imageData, error: insertError } = await supabase
      .from('images')
      .insert({
        prompt: request.prompt,
        title: request.title || 'Generated Image',
        description: request.description,
        prompt_id: request.promptId,
        user_id: publicUserId,
        ready: false,
        ai_generated: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating image record:', insertError);
      throw new Error('Failed to create image record');
    }

    console.log('Created image record:', imageData.id);

    const runwareApiKey = getRunwareApiKey();
    
    if (runwareApiKey) {
      // Step 2: Generate image with Runware API
      const runwareService = new RunwareService(runwareApiKey);
      
      const generatedImage = await runwareService.generateImage({
        positivePrompt: request.prompt,
        width: 1024,
        height: 1024,
        outputFormat: "WEBP"
      });

      // Step 3: Update image record with generated image
      const { error: updateError } = await supabase
        .from('images')
        .update({
          image_url: generatedImage.imageURL,
          optimized_image_url: generatedImage.imageURL,
          ready: true,
          width: 1024,
          height: 1024,
          model: 'runware:100@1',
          seed: generatedImage.seed,
          cost: generatedImage.cost,
          mature_content: generatedImage.NSFWContent,
        })
        .eq('id', imageData.id);

      if (updateError) {
        console.error('Error updating image record:', updateError);
        throw new Error('Failed to update image record');
      }

      console.log('Image generation completed with Runware');
    } else {
      // Demo mode with placeholder images
      console.log('Demo mode: Using placeholder image');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const placeholderImageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('images')
        .update({
          image_url: placeholderImageUrl,
          optimized_image_url: placeholderImageUrl,
          ready: true,
          width: 1024,
          height: 1024,
          model: 'demo-model',
        })
        .eq('id', imageData.id);

      if (updateError) {
        console.error('Error updating image record:', updateError);
        throw new Error('Failed to update image record');
      }

      console.log('Demo image generation completed');
    }
    
    return {
      success: true,
      imageId: imageData.id,
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
