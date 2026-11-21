export const CHILD_PHOTOS_BUCKET = "child-photos";
export const MAX_CHILD_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB (matches storage.buckets.file_size_limit)

export const ALLOWED_CHILD_PHOTO_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedChildPhotoMime = (typeof ALLOWED_CHILD_PHOTO_MIMES)[number];

const MIME_TO_EXT: Record<AllowedChildPhotoMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ImageValidationResult =
  | {
      valid: true;
      detectedMime: AllowedChildPhotoMime;
      extension: string;
      byteLength: number;
    }
  | {
      valid: false;
      errorCode:
        | "empty_file"
        | "file_too_large"
        | "unsupported_mime"
        | "signature_mismatch";
    };

/**
 * Inspects actual binary magic bytes to detect real image format.
 * Prevents extension/MIME spoofing (e.g. HTML/script/executable renamed to .jpg).
 */
export function detectImageMimeFromBytes(
  bytes: Uint8Array,
): AllowedChildPhotoMime | null {
  if (bytes.byteLength < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF" (52 49 46 46) at 0..3 and "WEBP" (57 45 42 50) at 8..11
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function validateChildPhotoUpload(input: {
  bytes: Uint8Array;
  declaredMime?: string | null;
  maxBytes?: number;
}): ImageValidationResult {
  const maxBytes = input.maxBytes ?? MAX_CHILD_PHOTO_BYTES;

  if (!input.bytes || input.bytes.byteLength === 0) {
    return { valid: false, errorCode: "empty_file" };
  }

  if (input.bytes.byteLength > maxBytes) {
    return { valid: false, errorCode: "file_too_large" };
  }

  if (
    input.declaredMime &&
    !ALLOWED_CHILD_PHOTO_MIMES.includes(
      input.declaredMime as AllowedChildPhotoMime,
    )
  ) {
    return { valid: false, errorCode: "unsupported_mime" };
  }

  const detectedMime = detectImageMimeFromBytes(input.bytes);
  if (!detectedMime) {
    return { valid: false, errorCode: "signature_mismatch" };
  }

  if (input.declaredMime && input.declaredMime !== detectedMime) {
    return { valid: false, errorCode: "signature_mismatch" };
  }

  return {
    valid: true,
    detectedMime,
    extension: MIME_TO_EXT[detectedMime],
    byteLength: input.bytes.byteLength,
  };
}

/**
 * Generates a randomized, non-guessable private storage object path with zero child PII.
 */
export function generatePrivatePhotoPath(
  orderId: string,
  mime: AllowedChildPhotoMime,
): string {
  const safeOrderId = orderId.replace(/[^a-zA-Z0-9-]/g, "");
  const randomId = crypto.randomUUID();
  const ext = MIME_TO_EXT[mime];
  return `orders/${safeOrderId}/${randomId}.${ext}`;
}
