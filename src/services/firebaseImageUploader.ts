/*
 * Firebase Image Uploader
 * -----------------------
 * A production-ready utility for uploading AI-generated images (PNG, JPEG, WebP)
 * to Firebase Storage with full progress tracking, validation, error handling
 * and batch upload support.
 *
 * Author: Historify AI Team
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
  UploadTaskSnapshot,
} from "firebase/storage";
import { firebaseStorage } from "@/integrations/firebase/client";

// -----------------------------------------------------------------------------
// Type & Constant Definitions
// -----------------------------------------------------------------------------

/** Accepted MIME types for image uploads */
export const ALLOWED_IMAGE_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/** Maximum allowed image size (bytes). Default: 10MB */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export type UploadState =
  | "queued"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadStatus {
  /** Current state of the upload */
  state: UploadState;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** The public download URL, once available */
  downloadURL?: string;
  /** Error message if state is `failed` */
  error?: string;
}

export interface SingleUploadOptions {
  /** Override the original filename (without extension). Extension will be derived from MIME. */
  customName?: string;
  /** Callback invoked whenever upload status changes */
  onStatus?: (status: UploadStatus) => void;
  /** AbortSignal to support cancellation */
  signal?: AbortSignal;
}

export interface BatchUploadOptions {
  /** Callback invoked for each file's status updates */
  onStatus?: (index: number, status: UploadStatus) => void;
  /** AbortSignal to cancel *all* uploads */
  signal?: AbortSignal;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Validate an image file/blob according to format & size rules.
 * Throws an error if validation fails.
 */
function validateImage(file: Blob): void {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported image format ${file.type}. Allowed: PNG, JPEG, WebP.`
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `File size exceeds limit (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB > 10 MB).`
    );
  }
}

/** Sanitize filename to remove potentially dangerous/path characters */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}

/** Create a storage path of form `ai-generated/YYYY-MM-DD/<uuid>.<ext>` */
function buildStoragePath(mime: string, originalName?: string): {
  folder: string;
  filename: string;
  fullPath: string;
} {
  const date = new Date().toISOString().split("T")[0];
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10);
  const ext = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
  const baseName = sanitizeFilename(originalName ?? uuid);
  const filename = `${baseName}_${uuid}.${ext}`;
  const folder = `ai-generated/${date}`;
  return { folder, filename, fullPath: `${folder}/${filename}` };
}

/** Convert Firebase UploadTaskSnapshot to progress % */
function snapshotProgress(snapshot: UploadTaskSnapshot): number {
  return Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
}

// -----------------------------------------------------------------------------
// Core Upload Functions
// -----------------------------------------------------------------------------

/**
 * Upload a single image (Blob | File) to Firebase Storage.
 * Resolves with the public download URL once completed.
 */
export async function uploadAIImage(
  file: File | Blob,
  options: SingleUploadOptions = {}
): Promise<string> {
  const { customName, onStatus, signal } = options;

  // Validation ----------------------------------------------------------------
  validateImage(file);
  const { fullPath } = buildStoragePath(file.type, customName ?? ("name" in file ? file.name : undefined));

  // Prepare metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      originalName: "name" in file ? file.name : customName ?? "blob",
      uploadTimestamp: new Date().toISOString(),
      fileSize: `${file.size}`,
    },
  };

  // Create Firebase Storage reference
  const storageRef = ref(firebaseStorage, fullPath);
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, metadata);

  // Handle cancellation via AbortSignal
  if (signal) {
    if (signal.aborted) {
      uploadTask.cancel();
    } else {
      signal.addEventListener(
        "abort",
        () => {
          uploadTask.cancel();
        },
        { once: true }
      );
    }
  }

  // Return a promise that resolves when upload completes
  return new Promise<string>((resolve, reject) => {
    const status: UploadStatus = { state: "queued", progress: 0 };
    onStatus?.(status);

    uploadTask.on(
      "state_changed",
      (snap) => {
        status.state = "uploading";
        status.progress = snapshotProgress(snap);
        onStatus?.({ ...status });
      },
      (err) => {
        const errorStatus: UploadStatus = {
          state: err.code === "storage/canceled" ? "cancelled" : "failed",
          progress: status.progress,
          error: err.message,
        };
        onStatus?.(errorStatus);
        reject(err);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const completeStatus: UploadStatus = {
            state: "completed",
            progress: 100,
            downloadURL,
          };
          onStatus?.(completeStatus);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Batch-upload multiple images. Progress callback is invoked for each item by index.
 */
export async function uploadAIImages(
  files: (File | Blob)[],
  options: BatchUploadOptions = {}
): Promise<string[]> {
  const { onStatus, signal } = options;
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) {
      throw new DOMException("Batch upload cancelled", "AbortError");
    }

    // eslint-disable-next-line no-await-in-loop
    const url = await uploadAIImage(files[i], {
      onStatus: (status) => onStatus?.(i, status),
      signal,
    });

    urls.push(url);
  }

  return urls;
}

// -----------------------------------------------------------------------------
// Helper: Convenience function to get a plain error message from caught errors
// -----------------------------------------------------------------------------
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// -----------------------------------------------------------------------------
// PUBLIC API SUMMARY (for JSDoc auto-generation)
//
// - ALLOWED_IMAGE_TYPES: Set<string>
// - MAX_IMAGE_SIZE_BYTES: number
// - UploadState, UploadStatus: types
// - uploadAIImage(file, options?): Promise<string>
// - uploadAIImages(files, options?): Promise<string[]>
// - getErrorMessage(error): string
// -----------------------------------------------------------------------------
