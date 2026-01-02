/**
 * Orbit animation configuration
 */
export interface OrbitConfig {
  /** Duration of full orbit in seconds */
  durationSec: number;
  /** Frames per second */
  fps: number;
  /** Orbit radius in meters */
  radiusMeters: number;
  /** Camera pitch in degrees (negative = looking down) */
  pitchDeg: number;
  /** Starting heading in degrees (0 = north) */
  headingStartDeg: number;
  /** Ending heading in degrees (default = headingStart + 360) */
  headingEndDeg: number;
  /** Height offset from target center in meters */
  heightOffsetMeters: number;
  /** Easing function type */
  easing: EasingType;
}

/**
 * Orbit target - the center point to orbit around
 */
export interface OrbitTarget {
  /** Center longitude in degrees */
  longitude: number;
  /** Center latitude in degrees */
  latitude: number;
  /** Center height in meters */
  height: number;
  /** Suggested radius from T3.3 bounding calculation */
  suggestedRadiusMeters: number;
}

/**
 * Single frame in the orbit timeline
 */
export interface OrbitFrame {
  /** Frame index (0-based) */
  index: number;
  /** Time in milliseconds from start */
  timeMs: number;
  /** Camera heading in radians */
  headingRad: number;
  /** Camera pitch in radians */
  pitchRad: number;
  /** Camera range/distance in meters */
  rangeMeters: number;
}

/**
 * Orbit state for tracking animation progress
 */
export interface OrbitState {
  /** Is orbit currently running */
  isRunning: boolean;
  /** Is in preview loop mode */
  isPreviewMode: boolean;
  /** Current progress (0-1) */
  progress: number;
  /** Current frame index */
  currentFrame: number;
  /** Total frame count */
  totalFrames: number;
  /** Was auto-fix applied */
  autoFixApplied: boolean;
  /** Auto-fix message if any */
  autoFixMessage: string | null;
}

/**
 * Easing function types
 */
export type EasingType = "linear" | "easeInOut" | "easeIn" | "easeOut";

/**
 * Safety limits for orbit configuration
 */
export interface SafetyLimits {
  /** Minimum orbit radius in meters */
  minRadiusMeters: number;
  /** Maximum orbit radius in meters */
  maxRadiusMeters: number;
  /** Minimum camera height above ground in meters */
  minHeightAboveGround: number;
  /** Minimum pitch in degrees (most looking down) */
  minPitchDeg: number;
  /** Maximum pitch in degrees (most looking up) */
  maxPitchDeg: number;
  /** Minimum duration in seconds */
  minDurationSec: number;
  /** Maximum duration in seconds */
  maxDurationSec: number;
  /** Minimum FPS */
  minFps: number;
  /** Maximum FPS */
  maxFps: number;
}

/**
 * Default safety limits
 */
export const DEFAULT_SAFETY_LIMITS: SafetyLimits = {
  minRadiusMeters: 100,
  maxRadiusMeters: 50000,
  minHeightAboveGround: 50,
  minPitchDeg: -85,
  maxPitchDeg: -5,
  minDurationSec: 3,
  maxDurationSec: 60,
  minFps: 15,
  maxFps: 60,
};

/**
 * Default orbit configuration
 */
export const DEFAULT_ORBIT_CONFIG: OrbitConfig = {
  durationSec: 12,
  fps: 30,
  radiusMeters: 1000,
  pitchDeg: -30,
  headingStartDeg: 0,
  headingEndDeg: 360,
  heightOffsetMeters: 0,
  easing: "linear",
};
