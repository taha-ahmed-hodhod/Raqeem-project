/**
 * Client-side child photo compression helper.
 * - Resizes oversized mobile photos to a crisp max dimension (1280px) suitable for illustration
 * - Converts to WebP (or JPEG fallback) at 0.82 quality to keep Supabase Storage lightweight (~80–250 KB)
 * - Strips EXIF/GPS metadata automatically by re-encoding through HTMLCanvasElement
 * - Gracefully returns the original file in non-canvas environments (e.g. jsdom unit tests)
 */
export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
  minBytesToCompress?: number;
}

export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? 1280;
  const quality = options.quality ?? 0.82;
  const minBytesToCompress = options.minBytesToCompress ?? 120 * 1024; // skip tiny files < 120KB

  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    file.size <= minBytesToCompress ||
    !file.type.startsWith("image/")
  ) {
    return file;
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("image_decode_failed"));
        image.src = objectUrl;
      });

      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;
      if (!naturalWidth || !naturalHeight) {
        return file;
      }

      const scale = Math.min(
        1,
        maxDimension / Math.max(naturalWidth, naturalHeight),
      );
      const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
      const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return file;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Prefer WebP for maximum compression with high clarity; fallback to JPEG
      const encodeBlob = (mime: "image/webp" | "image/jpeg") =>
        new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), mime, quality);
        });

      let compressedBlob = await encodeBlob("image/webp");
      let outMime: "image/webp" | "image/jpeg" = "image/webp";
      let outExt = "webp";

      if (!compressedBlob || compressedBlob.type !== "image/webp") {
        compressedBlob = await encodeBlob("image/jpeg");
        outMime = "image/jpeg";
        outExt = "jpg";
      }

      if (!compressedBlob || compressedBlob.size >= file.size) {
        return file;
      }

      const baseName = file.name.replace(/\.[^.]+$/, "") || "child-photo";
      return new File([compressedBlob], `${baseName}.${outExt}`, {
        type: outMime,
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    // Graceful fallback if canvas/image decode is unavailable
    return file;
  }
}
