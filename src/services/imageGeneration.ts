
import { supabase } from "@/integrations/supabase/client";
import { generateImageRunware } from "@/services/runwareService";
import { settings } from "@/lib/settings";

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
    
    // Step 1: Create image record in database with pending status
    // Generate a unique ID for the image
    const imageId = crypto.randomUUID();
    let imageData: any = {
      id: imageId,
      prompt: request.prompt,
      title: request.title || 'Generated Image',
      description: request.description,
      prompt_id: request.promptId,
      user_id: crypto.randomUUID(), // Required by database constraint
      ready: false,
      ai_generated: true,
      created_at: new Date().toISOString(),
    };
    
    // Try to insert into Supabase, but continue even if it fails
    const { data: dbImageData, error: insertError } = await supabase
      .from('images')
      .insert(imageData)
      .select()
      .single();

    if (insertError) {
      console.warn('Warning: Could not save to Supabase:', insertError);
      // Continue with local imageData instead of throwing error
    } else if (dbImageData) {
      // Use the database-returned data if available
      imageData = dbImageData;
    }

    console.log('Created image record:', imageData.id);

    // Step 2: Generate image via Runware. If generation fails, return an error (no mock images)
    let imageUrl: string | null = null;
    let generationError: string | undefined = undefined;

    const runwareRes = await generateImageRunware({
      prompt: request.prompt,
    });

    if (runwareRes.success && runwareRes.imageUrl) {
      imageUrl = runwareRes.imageUrl;
    } else {
      generationError = runwareRes.error || "Unknown error from Runware";
      console.error("Runware generation failed:", generationError);
    }

    if (!imageUrl) {
      // Early return on failure – do NOT fallback to mock/placeholder images
      return {
        success: false,
        error: generationError ?? "Image generation failed",
      };
    }

    // Step 3: Update image record with generated image URL
    // Update local imageData object
    imageData.image_url = imageUrl;
    imageData.optimized_image_url = imageUrl;
    imageData.ready = true;
    imageData.width = 800;
    imageData.height = 600;
    imageData.model = settings.VITE_RUNWARE_API_KEY ? "runware" : "demo-model";
    
    // Try to update in Supabase, but continue even if it fails
    try {
      const { error: updateError } = await supabase
        .from("images")
        .update({
          image_url: imageUrl,
          optimized_image_url: imageUrl,
          ready: true,
          width: 800,
          height: 600,
          model: settings.VITE_RUNWARE_API_KEY ? "runware" : "demo-model",
        })
        .eq("id", imageData.id);

      if (updateError) {
        console.warn('Warning: Could not update Supabase record:', updateError);
        // Continue with local imageData
      }
    } catch (error) {
      console.warn('Warning: Supabase update failed:', error);
      // Continue with local imageData
    }

    console.log('Image generation completed successfully');
    
    // Store in local storage for offline/fallback access
    try {
      const LOCAL_IMAGES_KEY = 'historify_cached_images';
      const existingImages = localStorage.getItem(LOCAL_IMAGES_KEY);
      const images = existingImages ? JSON.parse(existingImages) : [];
      
      // Add the new image to the local cache
      images.unshift({
        ...imageData,
        created_at: new Date().toISOString()
      });
      
      // Store back in local storage (limit to 50 images to prevent storage issues)
      localStorage.setItem(LOCAL_IMAGES_KEY, JSON.stringify(images.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to cache image in local storage:', e);
      // Continue anyway - this is just a fallback
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
