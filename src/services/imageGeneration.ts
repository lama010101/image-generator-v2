
import { supabase } from "@/integrations/supabase/client";
import { generateImageRunware } from "@/services/runwareService";
import { settings } from "@/lib/settings";

export interface GenerationRequest {
  /* Core prompt info */
  promptId: string;
  prompt: string;
  title?: string;
  description?: string;
  negative_prompt?: string;
  /* Generation settings */
  model?: string;
  steps?: number;
  cfgScale?: number;
  width?: number;
  height?: number;
  imageType?: 'webp' | 'png' | 'jpg';
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
    // 1a. Fetch the prompt so we can copy every overlapping column into the new image record (rule compliance)
    const { data: promptRow, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', request.promptId)
      .single();

    if (promptError || !promptRow) {
      throw new Error(`Prompt not found for id ${request.promptId}`);
    }

    // Generate a unique ID for the image
    const imageId = crypto.randomUUID();

    // Remove the primary key from the prompt object; we don't want to duplicate it in the images table

    // Define the set of columns that exist in BOTH tables.
    const commonColumns = new Set([
      '1_when_century','1_where_continent','2_when_event','2_when_event_years','2_where_landmark','2_where_landmark_km',
      '3_when_decade','3_where_region','4_when_event','4_when_event_years','4_where_landmark','4_where_landmark_km',
      '5_when_clues','5_where_clues','ai_generated','approx_people_count','celebrity','confidence','country',
      'date','description','gps_coordinates','key_elements','last_verified','latitude','location','longitude',
      'negative_prompt','prompt','real_event','source_citation','theme','title','user_id','year'
    ] as const);

    const promptColumnsSubset: Record<string, any> = {};
    Object.keys(promptRow as any).forEach((key) => {
      if (commonColumns.has(key as any)) {
        promptColumnsSubset[key] = (promptRow as any)[key];
      }
    });

    // Build the initial image record, copying ONLY overlapping prompt columns first, then overriding/adding image-specific ones
    let imageData: any = {
      id: imageId,
      ...promptColumnsSubset,
      prompt: request.prompt, // allow updated prompt text if provided
      title: request.title || (promptRow as any).title || 'Generated Image',
      description: request.description ?? (promptRow as any).description,
      prompt_id: request.promptId,
      ready: false,
      ai_generated: true,
      model: request.model || 'runware',
      // Use the same user as the prompt so FK constraint passes
      user_id: (promptRow as any).user_id,
      cfg_scale: request.cfgScale,
      steps: request.steps,
    };

    // Remove keys with null/undefined to avoid inserting into generated columns
    Object.keys(imageData).forEach((k) => {
      if (imageData[k] === null || imageData[k] === undefined) {
        delete imageData[k];
      }
    });
    
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

    // Mark the originating prompt as used
    try {
      await supabase
        .from('prompts')
        .update({ used: true })
        .eq('id', request.promptId);
    } catch (err) {
      console.warn('Warning: Failed to mark prompt as used:', err);
    }

    // Step 2: Generate image via either Runware or FAL based on selected model
    let originalImageUrl = "";
    const modelSel = request.model ?? "runware:100@1";

    if (modelSel.startsWith("fal-ai/")) {
      // --- Use Fal.ai service ---
      const { generateImageFal } = await import("@/services/falServiceQueue");

      // Ensure API key present
      if (!settings.VITE_FAL_API_KEY) {
        throw new Error("FAL API key is missing. Please set VITE_FAL_API_KEY in your environment.");
      }

      const falRes = await generateImageFal({
        prompt: request.prompt,
        negative_prompt: request.negative_prompt,
        image_size: request.width && request.height ? `${request.width}x${request.height}` : undefined,
        output_format: request.imageType === 'png' ? 'png' : request.imageType === 'jpg' ? 'jpeg' : undefined,
        model: modelSel,
      });

      if (!falRes.success || !falRes.imageUrl) {
        throw new Error(`Fal.ai image generation failed: ${falRes.error ?? "Unknown error"}`);
      }

      originalImageUrl = falRes.imageUrl;
    } else {
      // --- Use Runware service ---
      if (!settings.VITE_RUNWARE_API_KEY) {
        throw new Error("Runware API key is missing. Please set VITE_RUNWARE_API_KEY in your environment.");
      }

      const runwareRes = await generateImageRunware({
        prompt: request.prompt,
        negative_prompt: request.negative_prompt,
        width: request.width,
        height: request.height,
        model: modelSel,
        steps: request.steps,
        cfgScale: request.cfgScale,
        imageType: request.imageType,
      });

      if (!runwareRes.success || !runwareRes.imageUrl) {
        throw new Error(`Runware image generation failed: ${runwareRes.error ?? "Unknown error"}`);
      }

      originalImageUrl = runwareRes.imageUrl;
    }
    
    // Upload the generated image to Firebase Storage so that the file is under our control
    let optimizedImageUrl: string = '';
    // Placeholders for variant URLs and metadata so they are accessible outside the try/catch.
    let desktopURL = '';
    let mobileURL = '';
    let thumbnailURL = '';
    let variants: any = {
      desktop: { size: 0, width: 0, height: 0 },
      mobile: { size: 0, width: 0, height: 0 },
      thumbnail: { size: 0, width: 0, height: 0 },
    };

    try {
      // Dynamically import only in browser / client runtime to keep bundle size small.
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { firebaseStorage } = await import("@/integrations/firebase/client");

      // Fetch the remote image as a Blob
      const imageResponse = await fetch(originalImageUrl);
      const originalBlob = await imageResponse.blob();

    // Generate variants in the selected format (desktop, mobile, thumbnail)
    const { generateMultiFormatVariants } = await import("@/services/imageFormatService");
    variants = await generateMultiFormatVariants(originalBlob, request.imageType || 'webp');

      const imageType = request.imageType || 'webp';
      const fileExtension = imageType === 'jpg' ? 'jpg' : imageType;
      const mimeType = imageType === 'jpg' ? 'image/jpeg' : `image/${imageType}`;

      // Upload original image (for archival/reference)
      const originalStorageRef = ref(firebaseStorage, `original/${imageData.id}.${fileExtension}`);
      await uploadBytes(originalStorageRef, variants.original, {
        contentType: mimeType,
      });
      originalImageUrl = await getDownloadURL(originalStorageRef);

      // Upload variant images
      const desktopRef = ref(firebaseStorage, `desktop/${imageData.id}.${fileExtension}`);
      const mobileRef = ref(firebaseStorage, `mobile/${imageData.id}.${fileExtension}`);
      const thumbnailRef = ref(firebaseStorage, `thumbnail/${imageData.id}.${fileExtension}`);
      await Promise.all([
        uploadBytes(desktopRef, variants.desktop.blob, { contentType: mimeType }),
        uploadBytes(mobileRef, variants.mobile.blob, { contentType: mimeType }),
        uploadBytes(thumbnailRef, variants.thumbnail.blob, { contentType: mimeType }),
      ]);

      // Retrieve download URLs for the variants
      [desktopURL, mobileURL, thumbnailURL] = await Promise.all([
        getDownloadURL(desktopRef),
        getDownloadURL(mobileRef),
        getDownloadURL(thumbnailRef),
      ]);

      // We'll keep optimizedImageUrl as desktop URL for backward compatibility
      optimizedImageUrl = desktopURL;

      console.log(`Variant generation complete. Desktop: ${variants.desktop.size} bytes, Mobile: ${variants.mobile.size} bytes, Thumbnail: ${variants.thumbnail.size} bytes`);
    } catch (error) {
      console.warn("Image optimization failed, using original image only:", error);
      // If optimization fails, continue with the original image URL only.
      optimizedImageUrl = originalImageUrl;
    }

    // Step 3: Update image record with both image URLs
    // Update local imageData object
    imageData.image_url = originalImageUrl;
    imageData.desktop_image_url = desktopURL;
    imageData.mobile_image_url = mobileURL;
    imageData.thumbnail_image_url = thumbnailURL;
    imageData.desktop_size_kb = Math.round(variants.desktop.size / 1024);
    imageData.mobile_size_kb = Math.round(variants.mobile.size / 1024);
    imageData.original_size_kb = Math.round(variants.originalSize / 1024);
    imageData.optimized_image_url = optimizedImageUrl;
    imageData.ready = true;
    imageData.width = variants.desktop.width;
    imageData.height = variants.desktop.height;
    imageData.model = request.model || 'runware';
    imageData.cfg_scale = request.cfgScale;
    imageData.steps = request.steps;
    
    // Try to update in Supabase
    try {
      const { error: updateError } = await supabase
        .from('images')
        .update({
          image_url: originalImageUrl,
          optimized_image_url: optimizedImageUrl,
          desktop_image_url: desktopURL,
          mobile_image_url: mobileURL,
          thumbnail_image_url: thumbnailURL,
          desktop_size_kb: Math.round(variants.desktop.size / 1024),
          mobile_size_kb: Math.round(variants.mobile.size / 1024),
          original_size_kb: Math.round(variants.originalSize / 1024),
          ready: true,
          width: variants.desktop.width,
          height: variants.desktop.height,
          cfg_scale: request.cfgScale,
          steps: request.steps,
          model: request.model || 'runware'
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
