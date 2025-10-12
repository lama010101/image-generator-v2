import { supabase } from "@/integrations/supabase/client";
import { generateImageRunware } from "@/services/runwareService";
import { generateImage as generateReveImage } from "@/services/reveClient";
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
  imageType?: "webp" | "png" | "jpg";
}

export interface GenerationResult {
  success: boolean;
  imageId?: string;
  error?: string;
}

const blobToDataUrl = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read blob as data URL"));
    reader.readAsDataURL(blob);
  });
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  if (!base64) {
    throw new Error("No base64 payload provided");
  }

  if (typeof atob === "function") {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  if (typeof Buffer !== "undefined") {
    const buffer = Buffer.from(base64, "base64");
    return new Blob([buffer], { type: mimeType });
  }

  throw new Error("Base64 decoding is not supported in this environment");
};

const DEFAULT_WIDTH = 1344;
const DEFAULT_HEIGHT = 576;
const DEFAULT_ASPECT_RATIO = "21:9";
const DEFAULT_IMAGE_TYPE: GenerationRequest["imageType"] = "webp";

const computeAspectRatio = (
  width?: number | null,
  height?: number | null
): string | null => {
  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const normalizedWidth = Math.round(Math.abs(width));
  const normalizedHeight = Math.round(Math.abs(height));
  const divisor = gcd(normalizedWidth, normalizedHeight);

  return `${normalizedWidth / divisor}:${normalizedHeight / divisor}`;
};

interface AccuracyScore {
  request_id: string | null;
  credits_remaining: number | null;
  source: string;
}

interface ImageRecordPayload {
  id: string;
  prompt: string;
  prompt_id: string;
  ready: boolean;
  ai_generated: boolean;
  model?: string;
  title?: string;
  description?: string | null;
  user_id?: string;
  cfg_scale?: number;
  steps?: number;
  accuracy_score?: AccuracyScore;
  cost?: number;
  mature_content?: boolean | null;
  binary?: string;
  image_url?: string;
  optimized_image_url?: string;
  desktop_image_url?: string;
  mobile_image_url?: string;
  thumbnail_image_url?: string;
  desktop_size_kb?: number;
  mobile_size_kb?: number;
  original_size_kb?: number;
  width?: number;
  height?: number;
  aspect_ratio?: string | null;
  output_format?: GenerationRequest["imageType"];
  [key: string]: unknown;
}

interface VariantEntry {
  blob: Blob;
  size: number;
  width: number;
  height: number;
}

type VariantBundle = {
  original: Blob | null;
  originalSize: number;
  desktop: VariantEntry | null;
  mobile: VariantEntry | null;
  thumbnail: VariantEntry | null;
};

type CachedImage = Record<string, unknown> & { created_at?: string };

export const generateImage = async (request: GenerationRequest): Promise<GenerationResult> => {
  try {
    console.log("Starting image generation for prompt:", request.prompt);

    // Step 1: Create image record (pending status)
    const { data: promptRow, error: promptError } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", request.promptId)
      .single();

    if (promptError || !promptRow) {
      throw new Error(`Prompt not found for id ${request.promptId}`);
    }

    const imageId = crypto.randomUUID();

    const commonColumns = new Set([
      "1_when_century","1_where_continent","2_when_event","2_when_event_years","2_where_landmark","2_where_landmark_km",
      "3_when_decade","3_where_region","4_when_event","4_when_event_years","4_where_landmark","4_where_landmark_km",
      "5_when_clues","5_where_clues","ai_generated","approx_people_count","celebrity","confidence","country",
      "date","description","gps_coordinates","key_elements","last_verified","latitude","location","longitude",
      "negative_prompt","prompt","real_event","source_citation","theme","title","user_id","year"
    ] as const);

    const promptColumnsSubset: Record<string, unknown> = {};
    const promptRowRecord = promptRow as Record<string, unknown>;

    Object.keys(promptRowRecord).forEach((key) => {
      if (commonColumns.has(key)) {
        promptColumnsSubset[key] = promptRowRecord[key];
      }
    });

    let imageData: ImageRecordPayload = {
      id: imageId,
      ...promptColumnsSubset,
      prompt: request.prompt,
      title: request.title || (promptRowRecord.title as string | undefined) || "Generated Image",
      description: (request.description ?? promptRowRecord.description) as string | null | undefined,
      prompt_id: request.promptId,
      ready: false,
      ai_generated: true,
      model: request.model || "runware",
      user_id: promptRowRecord.user_id as string | undefined,
      cfg_scale: request.cfgScale,
      steps: request.steps,
    };

    Object.keys(imageData).forEach((key) => {
      if (imageData[key] === null || imageData[key] === undefined) {
        delete imageData[key];
      }
    });

    const { data: dbImageData, error: insertError } = await supabase
      .from("images")
      .insert(imageData)
      .select()
      .single();

    if (insertError) {
      console.warn("Warning: Could not save to Supabase:", insertError);
    } else if (dbImageData) {
      imageData = dbImageData as ImageRecordPayload;
    }

    console.log("Created image record:", imageData.id);

    const modelSel = request.model ?? "runware:100@1";
    imageData.model = modelSel;

    const targetWidth = request.width ?? DEFAULT_WIDTH;
    const targetHeight = request.height ?? DEFAULT_HEIGHT;
    let targetImageType = request.imageType ?? DEFAULT_IMAGE_TYPE;
    const requestedAspectRatio = computeAspectRatio(targetWidth, targetHeight) ?? DEFAULT_ASPECT_RATIO;

    let originalImageUrl = "";
    let binaryDataUrl: string | null = null;
    let sourceBlob: Blob | null = null;

    if (modelSel.startsWith("fal-ai/")) {
      const { generateImageFal } = await import("@/services/falServiceQueue");

      if (!settings.VITE_FAL_API_KEY) {
        throw new Error("FAL API key is missing. Please set VITE_FAL_API_KEY in your environment.");
      }

      const falRes = await generateImageFal({
        prompt: request.prompt,
        negative_prompt: request.negative_prompt,
        image_size: `${targetWidth}x${targetHeight}`,
        output_format:
          targetImageType === "png"
            ? "png"
            : targetImageType === "jpg"
              ? "jpeg"
              : undefined,
        model: modelSel,
      });

      if (!falRes.success || !falRes.imageUrl) {
        throw new Error(`Fal.ai image generation failed: ${falRes.error ?? "Unknown error"}`);
      }

      originalImageUrl = falRes.imageUrl;
    } else if (modelSel.startsWith("reve:")) {
      const version = modelSel.split(":")[1] || "latest";

      const reveResponse = await generateReveImage({
        prompt: request.prompt,
        aspect_ratio: requestedAspectRatio,
        version,
      });

      if (!reveResponse?.image) {
        throw new Error("REVE image generation failed: no image payload received");
      }

      const baseMimeType = "image/png";
      sourceBlob = base64ToBlob(reveResponse.image, baseMimeType);
      binaryDataUrl = await blobToDataUrl(sourceBlob);
      originalImageUrl = binaryDataUrl;

      if (targetImageType !== "png") {
        try {
          const { generateImageInFormat } = await import("@/services/imageFormatService");
          const converted = await generateImageInFormat({
            input: sourceBlob,
            format: targetImageType,
            maxWidth: Math.max(targetWidth, targetHeight),
          });
          sourceBlob = converted.blob;
          binaryDataUrl = await blobToDataUrl(sourceBlob);
          originalImageUrl = binaryDataUrl;
        } catch (conversionError) {
          console.warn("REVE format conversion failed, falling back to PNG", conversionError);
          targetImageType = "png";
        }
      }

      imageData.accuracy_score = {
        request_id: reveResponse.request_id || null,
        credits_remaining: reveResponse.credits_remaining ?? null,
        source: "reve",
      };
      imageData.cost = reveResponse.credits_used ?? imageData.cost;
      imageData.mature_content = reveResponse.content_violation ?? null;
    } else {
      if (!settings.VITE_RUNWARE_API_KEY) {
        throw new Error("Runware API key is missing. Please set VITE_RUNWARE_API_KEY in your environment.");
      }

      const runwareRes = await generateImageRunware({
        prompt: request.prompt,
        negative_prompt: request.negative_prompt,
        width: targetWidth,
        height: targetHeight,
        model: modelSel,
        steps: request.steps,
        cfgScale: request.cfgScale,
        imageType: targetImageType,
        includeCost: true,
      });

      if (!runwareRes.success || !runwareRes.imageUrl) {
        throw new Error(`Runware image generation failed: ${runwareRes.error ?? "Unknown error"}`);
      }

      originalImageUrl = runwareRes.imageUrl;
      if (typeof runwareRes.cost === "number") {
        imageData.cost = runwareRes.cost;
      }
    }

    let optimizedImageUrl = "";
    let desktopURL = "";
    let mobileURL = "";
    let thumbnailURL = "";

    let variants: VariantBundle = {
      original: null,
      originalSize: 0,
      desktop: null,
      mobile: null,
      thumbnail: null,
    };

    let blobForUpload: Blob | null = sourceBlob;

    try {
      const [{ ref, uploadBytes, getDownloadURL }, { firebaseStorage }] = await Promise.all([
        import("firebase/storage"),
        import("@/integrations/firebase/client"),
      ]);

      if (!blobForUpload) {
        const imageResponse = await fetch(originalImageUrl);
        blobForUpload = await imageResponse.blob();
      }

      if (!blobForUpload) {
        throw new Error("Failed to retrieve image blob for upload");
      }

      const { generateMultiFormatVariants } = await import("@/services/imageFormatService");
      const generatedVariants = await generateMultiFormatVariants(blobForUpload, targetImageType);

      variants = {
        original: generatedVariants.original,
        originalSize: generatedVariants.originalSize,
        desktop: generatedVariants.desktop,
        mobile: generatedVariants.mobile,
        thumbnail: generatedVariants.thumbnail,
      };

      if (!variants.original || !variants.desktop || !variants.mobile || !variants.thumbnail) {
        throw new Error("Variant generation incomplete");
      }

      const fileExtension = targetImageType === "jpg" ? "jpg" : targetImageType;
      const mimeType = targetImageType === "jpg" ? "image/jpeg" : `image/${targetImageType}`;

      const originalStorageRef = ref(firebaseStorage, `original/${imageData.id}.${fileExtension}`);
      await uploadBytes(originalStorageRef, variants.original, { contentType: mimeType });
      originalImageUrl = await getDownloadURL(originalStorageRef);

      const desktopRef = ref(firebaseStorage, `desktop/${imageData.id}.${fileExtension}`);
      const mobileRef = ref(firebaseStorage, `mobile/${imageData.id}.${fileExtension}`);
      const thumbnailRef = ref(firebaseStorage, `thumbnail/${imageData.id}.${fileExtension}`);

      await Promise.all([
        uploadBytes(desktopRef, variants.desktop.blob, { contentType: mimeType }),
        uploadBytes(mobileRef, variants.mobile.blob, { contentType: mimeType }),
        uploadBytes(thumbnailRef, variants.thumbnail.blob, { contentType: mimeType }),
      ]);

      [desktopURL, mobileURL, thumbnailURL] = await Promise.all([
        getDownloadURL(desktopRef),
        getDownloadURL(mobileRef),
        getDownloadURL(thumbnailRef),
      ]);

      optimizedImageUrl = desktopURL;
      console.log(
        `Variant generation complete. Desktop: ${variants.desktop.size} bytes, Mobile: ${variants.mobile.size} bytes, Thumbnail: ${variants.thumbnail.size} bytes`
      );
    } catch (error) {
      console.warn("Image optimization failed, attempting inline fallback:", error);
      try {
        if (!blobForUpload) {
          const response = await fetch(originalImageUrl);
          blobForUpload = await response.blob();
        }

        if (blobForUpload) {
          const dataUrl = await blobToDataUrl(blobForUpload);
          originalImageUrl = dataUrl;
          optimizedImageUrl = dataUrl;
          desktopURL = dataUrl;
          mobileURL = dataUrl;
          thumbnailURL = dataUrl;

          if (!binaryDataUrl) {
            binaryDataUrl = dataUrl;
          }

          const fallbackEntry: VariantEntry = {
            blob: blobForUpload,
            size: blobForUpload.size,
            width: targetWidth,
            height: targetHeight,
          };

          variants = {
            original: blobForUpload,
            originalSize: blobForUpload.size,
            desktop: fallbackEntry,
            mobile: { ...fallbackEntry },
            thumbnail: { ...fallbackEntry },
          };
        } else {
          optimizedImageUrl = originalImageUrl;
        }
      } catch (dataUrlError) {
        console.warn("Inline fallback failed, using original image only:", dataUrlError);
        optimizedImageUrl = originalImageUrl;
      }
    }

    if (!variants.original || !variants.desktop || !variants.mobile || !variants.thumbnail) {
      const fallbackBlob = blobForUpload ?? new Blob();
      const fallbackEntry: VariantEntry = {
        blob: fallbackBlob,
        size: fallbackBlob.size,
        width: targetWidth,
        height: targetHeight,
      };

      variants = {
        original: fallbackBlob,
        originalSize: fallbackBlob.size,
        desktop: fallbackEntry,
        mobile: { ...fallbackEntry },
        thumbnail: { ...fallbackEntry },
      };
    }

    const finalWidth = variants.desktop?.width ?? targetWidth;
    const finalHeight = variants.desktop?.height ?? targetHeight;
    const finalAspectRatio = computeAspectRatio(finalWidth, finalHeight) ?? requestedAspectRatio;

    imageData.image_url = originalImageUrl;
    imageData.desktop_image_url = desktopURL;
    imageData.mobile_image_url = mobileURL;
    imageData.thumbnail_image_url = thumbnailURL;
    imageData.desktop_size_kb = Math.round((variants.desktop?.size ?? 0) / 1024);
    imageData.mobile_size_kb = Math.round((variants.mobile?.size ?? 0) / 1024);
    imageData.original_size_kb = Math.round(variants.originalSize / 1024);
    imageData.optimized_image_url = optimizedImageUrl;
    imageData.ready = false;
    imageData.width = finalWidth;
    imageData.height = finalHeight;
    imageData.aspect_ratio = finalAspectRatio;
    imageData.output_format = targetImageType;
    imageData.cfg_scale = request.cfgScale;
    imageData.steps = request.steps;
    if (binaryDataUrl) {
      imageData.binary = binaryDataUrl;
    }

    try {
      const updatePayload: Partial<ImageRecordPayload> = {
        image_url: originalImageUrl,
        optimized_image_url: optimizedImageUrl,
        desktop_image_url: desktopURL,
        mobile_image_url: mobileURL,
        thumbnail_image_url: thumbnailURL,
        desktop_size_kb: Math.round((variants.desktop?.size ?? 0) / 1024),
        mobile_size_kb: Math.round((variants.mobile?.size ?? 0) / 1024),
        original_size_kb: Math.round(variants.originalSize / 1024),
        ready: false,
        width: finalWidth,
        height: finalHeight,
        aspect_ratio: finalAspectRatio,
        output_format: targetImageType,
        cfg_scale: request.cfgScale,
        steps: request.steps,
        model: modelSel,
      };

      if (binaryDataUrl) {
        updatePayload.binary = binaryDataUrl;
      }

      if (imageData.accuracy_score) {
        updatePayload.accuracy_score = imageData.accuracy_score;
      }

      if (typeof imageData.cost === "number") {
        updatePayload.cost = imageData.cost;
      }

      if (typeof imageData.mature_content === "boolean") {
        updatePayload.mature_content = imageData.mature_content;
      }

      const { error: updateError } = await supabase
        .from("images")
        .update(updatePayload)
        .eq("id", imageData.id);

      if (updateError) {
        console.warn("Warning: Could not update Supabase record:", updateError);
      }
    } catch (error) {
      console.warn("Warning: Supabase update failed:", error);
    }

    console.log("Image generation completed successfully");

    try {
      const LOCAL_IMAGES_KEY = "historify_cached_images";
      const existingImages = localStorage.getItem(LOCAL_IMAGES_KEY);
      const images: CachedImage[] = existingImages ? (JSON.parse(existingImages) as CachedImage[]) : [];

      images.unshift({
        ...imageData,
        created_at: new Date().toISOString(),
      });

      localStorage.setItem(LOCAL_IMAGES_KEY, JSON.stringify(images.slice(0, 50)));
    } catch (e) {
      console.warn("Failed to cache image in local storage:", e);
    }

    return {
      success: true,
      imageId: imageData.id,
    };
  } catch (error) {
    console.error("Image generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
