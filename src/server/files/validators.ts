import { z } from "zod";

// Allowed MIME types for KML/KMZ
export const ALLOWED_MIME_TYPES = [
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  "application/xml",
  "text/xml",
] as const;

// File extension to type mapping
export const EXTENSION_TO_TYPE = {
  ".kml": "KML",
  ".kmz": "KMZ",
} as const;

// Max file size: 20MB
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const uploadFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export type FileTypeFromExtension = (typeof EXTENSION_TO_TYPE)[keyof typeof EXTENSION_TO_TYPE];

export function getFileTypeFromName(fileName: string): FileTypeFromExtension | null {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  return EXTENSION_TO_TYPE[ext as keyof typeof EXTENSION_TO_TYPE] ?? null;
}

export function isAllowedMimeType(mime: string): boolean {
  // Be lenient with mime types as browsers may vary
  return (
    ALLOWED_MIME_TYPES.includes(mime as (typeof ALLOWED_MIME_TYPES)[number]) ||
    mime === "application/octet-stream" // Fallback for KMZ
  );
}
