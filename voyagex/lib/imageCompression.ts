/**
 * Client-side image compression using the Canvas API.
 * Reduces upload size for low-bandwidth Northern Pakistan connections.
 */

export interface CompressionOptions {
  /** Maximum file size in bytes. Default: 800KB */
  maxSizeBytes?: number;
  /** Initial JPEG quality (0–1). Default: 0.85 */
  quality?: number;
  /** Maximum dimension (width or height) in pixels. Default: 1920 */
  maxDimension?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeBytes: 800 * 1024,    // 800 KB
  quality: 0.85,
  maxDimension: 1920,
};

/**
 * Compress an image File before uploading.
 * Returns a new File with reduced size, or the original if already small enough.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip if already within size limit or not an image
  if (file.size <= opts.maxSizeBytes || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > opts.maxDimension || height > opts.maxDimension) {
        const ratio = Math.min(opts.maxDimension / width, opts.maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively reduce quality until under size limit
      let quality = opts.quality;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size <= opts.maxSizeBytes || quality <= 0.3) {
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          },
          "image/jpeg",
          quality,
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fall back to original on error
    };

    img.src = url;
  });
}

/** Profile/avatar images: max 300KB, max 800px */
export const compressAvatar = (file: File) =>
  compressImage(file, { maxSizeBytes: 300 * 1024, maxDimension: 800, quality: 0.8 });

/** Gallery/package images: max 600KB, max 1200px */
export const compressGalleryImage = (file: File) =>
  compressImage(file, { maxSizeBytes: 600 * 1024, maxDimension: 1200, quality: 0.82 });

/** Verification documents: max 1MB (keep resolution for legibility) */
export const compressDocument = (file: File) =>
  compressImage(file, { maxSizeBytes: 1024 * 1024, maxDimension: 2000, quality: 0.88 });
