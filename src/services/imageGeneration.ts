
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

    // Step 2: Generate image via Runware if API key available, otherwise fallback to placeholder
    if (!settings.VITE_RUNWARE_API_KEY) {
      throw new Error("Runware API key is missing. Please set VITE_RUNWARE_API_KEY in your environment.");
    }

    const runwareRes = await generateImageRunware({
      prompt: request.prompt,
    });

    if (!runwareRes.success || !runwareRes.imageUrl) {
      throw new Error(
        `Runware image generation failed: ${runwareRes.error ?? "Unknown error"}`
      );
    }

    // Upload the Runware-hosted image to Firebase Storage so that the file is under our control
    let originalImageUrl: string = runwareRes.imageUrl;
    let optimizedImageUrl: string = '';

    try {
      // Dynamically import only in browser / client runtime to keep bundle size small.
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { firebaseStorage } = await import("@/integrations/firebase/client");

      // Fetch the remote image as a Blob
      const imageResponse = await fetch(originalImageUrl);
      const originalBlob = await imageResponse.blob();

      // Optimize the image
      const { optimiseToWebP1024 } = await import("@/services/imageOptimizer");
      const optimizationResult = await optimiseToWebP1024(originalBlob);

      // Upload original image
      const originalStorageRef = ref(firebaseStorage, `original/${imageData.id}.jpg`);
      await uploadBytes(originalStorageRef, optimizationResult.original, {
        contentType: "image/jpeg",
      });
      originalImageUrl = await getDownloadURL(originalStorageRef);

      // Upload optimized image
      const optimizedStorageRef = ref(firebaseStorage, `optimized/${imageData.id}.webp`);
      await uploadBytes(optimizedStorageRef, optimizationResult.optimized, {
        contentType: "image/webp",
      });
      optimizedImageUrl = await getDownloadURL(optimizedStorageRef);

      console.log(`Image optimization complete. Original: ${optimizationResult.originalSize} bytes, Optimized: ${optimizationResult.optimizedSize} bytes`);
    } catch (error) {
      console.error("Failed to process images:", error);
      throw new Error("Failed to process and store images");
    }

    // Step 3: Update image record with both image URLs
    // Update local imageData object
    imageData.image_url = originalImageUrl;
    imageData.optimized_image_url = optimizedImageUrl;
    imageData.ready = true;
    imageData.width = 1024;
    imageData.height = 1024;
    imageData.model = settings.VITE_RUNWARE_API_KEY ? "runware" : "demo-model";
    
    // Try to update in Supabase
    try {
      const { error: updateError } = await supabase
        .from('images')
        .update({
          image_url: originalImageUrl,
          optimized_image_url: optimizedImageUrl,
          ready: true,
          width: 1024,
          height: 1024,
          model: settings.VITE_RUNWARE_API_KEY ? "runware" : "demo-model",
          updated_at: new Date().toISOString()
        })
        .eq('id', imageData.id);

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
