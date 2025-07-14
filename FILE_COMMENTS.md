# File Comments Report

This document lists all files in the `src` directory of the project and, for each file, all comments found within. Only actual comments present in the source files are included.

---

## src/App.css

```
#root {
  filter: drop-shadow(0 0 2em #646cffaa);
  filter: drop-shadow(0 0 2em #61dafbaa);
  color: #888;
}
```

---

## src/components/filters/FiltersPanel.tsx

```
  /** Date created range [from, to] (timestamps in ms) */
  /** Approximate number of people range [min, max] */
  /** Confidence range [min, max] */
              {/* Theme & Location */}
              {/* Celebrity Only */}
```

---

## src/components/generate/GenerateSettingsDialog.tsx

```
          {/* Model */}
          {/* Steps */}
          {/* CFG Scale */}
          {/* Width & Height */}
```

---

## src/components/ui/chart.tsx

```
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
```

---

## src/hooks/useProjectTasks.ts

```
/**
 *
 */
```

---

## src/index.css

```
/* Definition of the design system. All colors, gradients, fonts, etc should be defined here.  */
```

---

## src/integrations/firebase/client.ts

```
/**
 *
 */
```

---

## src/lib/settings.ts

```
/**
 *
 */
```

---

## src/pages/Gallery.tsx

```
        {/* Filters Panel */}
        {/* Selection Toolbar */}
                      {/* Ready/Not Ready Tag */}
```

---

## src/services/firebaseImageUploader.ts

```
/*
 *
 */
// -----------------------------------------------------------------------------
// Type & Constant Definitions
// -----------------------------------------------------------------------------
/** Accepted MIME types for image uploads */
/** Maximum allowed image size (bytes). Default: 10MB */
  /** Current state of the upload */
  /** Upload progress percentage (0-100) */
  /** The public download URL, once available */
  /** Error message if state is `failed` */
  /** Override the original filename (without extension). Extension will be derived from MIME. */
  /** Callback invoked whenever upload status changes */
  /** AbortSignal to support cancellation */
  /** Callback invoked for each file's status updates */
  /** AbortSignal to cancel *all* uploads */
// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------
/**
 *
 */
/** Sanitize filename to remove potentially dangerous/path characters */
/** Create a storage path of form `ai-generated/YYYY-MM-DD/<uuid>.<ext>` */
/** Convert Firebase UploadTaskSnapshot to progress % */
/**
 *
 */
/**
 *
 */
```

---

## src/services/imageGeneration.ts

```
    // Step 1: Create image record in database with pending status
    // 1a. Fetch the prompt so we can copy every overlapping column into the new image record (rule compliance)
    // Generate a unique ID for the image
    // Remove the primary key from the prompt object; we don't want to duplicate it in the images table
    // Define the set of columns that exist in BOTH tables.
    // Build the initial image record, copying ONLY overlapping prompt columns first, then overriding/adding image-specific ones
      prompt: request.prompt, // allow updated prompt text if provided
      // Use the same user as the prompt so FK constraint passes
    // Remove keys with null/undefined to avoid inserting into generated columns
    // Try to insert into Supabase, but continue even if it fails
      // Continue with local imageData instead of throwing error
      // Use the database-returned data if available
    // Step 2: Generate image via Runware if API key available, otherwise fallback to placeholder
    // Upload the Runware-hosted image to Firebase Storage so that the file is under our control
    // Placeholders for variant URLs and metadata so they are accessible outside the try/catch.
      // Dynamically import only in browser / client runtime to keep bundle size small.
      // Fetch the remote image as a Blob
      // Generate WebP variants (desktop, mobile, thumbnail)
      // Upload original image (for archival/reference)
      // Upload variant images
      // Retrieve download URLs for the variants
      // We'll keep optimizedImageUrl as desktop URL for backward compatibility
      // If optimization fails, continue with the original image URL only.
    // Step 3: Update image record with both image URLs
    // Update local imageData object
    // Try to update in Supabase
        // Continue with local imageData
      // Continue with local imageData
    // Store in local storage for offline/fallback access
      // Add the new image to the local cache
      // Store back in local storage (limit to 50 images to prevent storage issues)
      // Continue anyway - this is just a fallback
```

---

## src/services/imageOptimizer.ts

```
/**
 *
 */
  // Store original blob and its size
    // Create an ImageBitmap from the input Blob (works in modern browsers)
    // Calculate new dimensions (max width 1024px, preserve aspect ratio, never enlarge)
    // Draw onto an off-screen canvas
    // Encode to WebP (quality 0.9). If browser doesn’t support WebP encoding, this may return null.
    // Rethrow so calling code can decide whether to continue with original.
```

---

## src/services/imageVariants.ts

```
/** Information about a generated WebP variant. */
/** Result object containing original blob and three WebP variants. */
/**
 *
 */
/**
 *
 */
/**
 *
 */
```

---

## src/services/runwareService.ts

```
/**
 * For full API details see: https://runware.ai/docs/en/image-inference/api-reference
 */
      "https://api.runware.ai/v1",
```

---

## src/stores/queueStore.ts

```
/**
 *
 */
  /** Populated when status === 'error'. */
/** Persisted localStorage key (must survive refresh). */
/** Default concurrency (max simultaneous generations). */
  /** Add one or more prompt IDs to the queue (duplicates ignored). */
  /** Remove a prompt from the queue irrespective of status. */
  /** Clear the entire queue. */
  /** Internal: update status of an item. */
  /** Derived helpers (selectors) */
      partialize: (state) => ({ items: state.items }), // persist only items; concurrency from env each load
// Helper to fetch next batch up to concurrency limit. UI or queue runner can call this.
```

---

## src/utils/domPolyfills.ts

```
/*
 *
 */
```
