// Types
export type {
  RecordingConfig,
  RecordingResult,
  RecordingState,
  RecordingQuality,
  QualitySettings,
} from "./types";

export { QUALITY_PRESETS, DEFAULT_RECORDING_CONFIG } from "./types";

// MIME utilities
export {
  isMediaRecorderSupported,
  isMimeTypeSupported,
  getBestSupportedMimeType,
  getSupportedMimeTypes,
  getFileExtension,
  getBrowserRecommendation,
} from "./mime";

// Recording Engine
export {
  RecordingEngine,
  getRecordingEngine,
  resetRecordingEngine,
  downloadRecording,
} from "./recordingEngine";
