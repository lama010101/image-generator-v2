
import { supabase } from "@/integrations/supabase/client";

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

export const generateImage = async (request: GenerationRequest): Promise<GenerationResult> => {
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

    // Step 2: Simulate image generation (replace with actual API call)
    // For now, we'll simulate a delay and then update with a placeholder
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Update image record with generated image URL
    const placeholderImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
    
    const { error: updateError } = await supabase
      .from('images')
      .update({
        image_url: placeholderImageUrl,
        optimized_image_url: placeholderImageUrl,
        ready: true,
        width: 800,
        height: 600,
        model: 'demo-model',
      })
      .eq('id', imageData.id);

    if (updateError) {
      console.error('Error updating image record:', updateError);
      throw new Error('Failed to update image record');
    }

    console.log('Image generation completed successfully');
    
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
