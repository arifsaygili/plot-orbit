/**
 * MIME type support detection and selection for MediaRecorder
 */

/**
 * Preferred MIME types in order of preference
 */
const PREFERRED_MIME_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

/**
 * Check if MediaRecorder is supported in this browser
 */
export function isMediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== "undefined";
}

/**
 * Check if a specific MIME type is supported
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  if (!isMediaRecorderSupported()) {
    return false;
  }
  return MediaRecorder.isTypeSupported(mimeType);
}

/**
 * Get the best supported MIME type for recording
 * Returns null if no supported type is found
 */
export function getBestSupportedMimeType(): string | null {
  if (!isMediaRecorderSupported()) {
    return null;
  }

  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

/**
 * Get all supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  if (!isMediaRecorderSupported()) {
    return [];
  }

  return PREFERRED_MIME_TYPES.filter((type) =>
    MediaRecorder.isTypeSupported(type)
  );
}

/**
 * Get file extension for a MIME type
 */
export function getFileExtension(mimeType: string): string {
  if (mimeType.startsWith("video/webm")) {
    return "webm";
  }
  if (mimeType.startsWith("video/mp4")) {
    return "mp4";
  }
  return "webm"; // Default
}

/**
 * Get browser recommendation message if recording is not supported
 */
export function getBrowserRecommendation(): string {
  if (!isMediaRecorderSupported()) {
    return "Video recording is not supported in this browser. Please use Chrome, Edge, or Firefox for the best experience.";
  }

  const supported = getSupportedMimeTypes();
  if (supported.length === 0) {
    return "No video formats are supported in this browser. Please use Chrome or Edge for WebM recording.";
  }

  return "";
}
