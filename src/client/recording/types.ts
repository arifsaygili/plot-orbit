/**
 * Recording configuration
 */
export interface RecordingConfig {
  /** Frames per second */
  fps: number;
  /** MIME type (e.g., 'video/webm;codecs=vp9') */
  mimeType?: string;
  /** Video bitrate in bits per second */
  bitsPerSecond?: number;
}

/**
 * Recording result after stopping
 */
export interface RecordingResult {
  /** The recorded video blob */
  blob: Blob;
  /** Duration in milliseconds */
  durationMs: number;
  /** MIME type used */
  mimeType: string;
  /** Object URL for preview/download */
  objectUrl: string;
}

/**
 * Recording state
 */
export interface RecordingState {
  /** Is recording in progress */
  isRecording: boolean;
  /** Elapsed time in milliseconds */
  elapsedMs: number;
  /** Is browser supported */
  isSupported: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Quality preset for recording
 */
export type RecordingQuality = "low" | "medium" | "high";

/**
 * Quality settings
 */
export interface QualitySettings {
  bitsPerSecond: number;
  label: string;
}

/**
 * Quality presets mapping
 */
export const QUALITY_PRESETS: Record<RecordingQuality, QualitySettings> = {
  low: {
    bitsPerSecond: 2_500_000, // 2.5 Mbps
    label: "Low (2.5 Mbps)",
  },
  medium: {
    bitsPerSecond: 5_000_000, // 5 Mbps
    label: "Medium (5 Mbps)",
  },
  high: {
    bitsPerSecond: 10_000_000, // 10 Mbps
    label: "High (10 Mbps)",
  },
};

/**
 * Default recording config
 */
export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  fps: 30,
  bitsPerSecond: QUALITY_PRESETS.medium.bitsPerSecond,
};
