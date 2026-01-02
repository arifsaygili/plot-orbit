// Types
export type {
  OrbitConfig,
  OrbitTarget,
  OrbitFrame,
  OrbitState,
  EasingType,
  SafetyLimits,
} from "./types";

export { DEFAULT_ORBIT_CONFIG, DEFAULT_SAFETY_LIMITS } from "./types";

// Controller
export {
  OrbitController,
  getOrbitController,
  resetOrbitController,
} from "./orbitController";

// Math utilities
export {
  degToRad,
  radToDeg,
  lerp,
  clamp,
  normalizeAngle,
  applyEasing,
  calculateHeading,
  calculateFrameCount,
  calculateFrameTime,
  calculateProgress,
  calculateSafeRange,
} from "./orbitMath";

// Safety
export type { SafetyResult } from "./orbitSafety";
export {
  validateAndFixConfig,
  validateConfig,
  getTerrainHeightAtTarget,
  calculateSafeRadius,
} from "./orbitSafety";

// Timeline (for EPIC-6 video recording)
export {
  generateOrbitFrames,
  getFrameAtTime,
  getInterpolatedFrame,
  getOrbitStats,
} from "./orbitTimeline";
