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

// Composite Recorder (for overlay burn-in)
export {
  CompositeRecorder,
  getCompositeRecorder,
  resetCompositeRecorder,
} from "./compositeRecorder";

// Overlay configuration
export type {
  OverlayTextConfig,
  OverlayConfig,
} from "./overlay";

export {
  DEFAULT_TOP_TEXT,
  DEFAULT_BOTTOM_TEXT,
  DEFAULT_REELS_OVERLAY,
  drawOverlay,
} from "./overlay";
