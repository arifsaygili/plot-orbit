import type { OrbitConfig, OrbitTarget, OrbitFrame } from "./types";
import { DEFAULT_ORBIT_CONFIG } from "./types";
import {
  degToRad,
  calculateFrameCount,
  calculateHeading,
  calculateProgress,
} from "./orbitMath";

/**
 * Generate all frames for an orbit animation
 * This is a pure function - same input always produces same output (deterministic)
 *
 * @param target - The target to orbit around
 * @param config - Orbit configuration (partial, merged with defaults)
 * @returns Array of OrbitFrame objects
 */
export function generateOrbitFrames(
  target: OrbitTarget,
  config: Partial<OrbitConfig> = {}
): OrbitFrame[] {
  // Merge with defaults
  const fullConfig: OrbitConfig = {
    ...DEFAULT_ORBIT_CONFIG,
    radiusMeters: target.suggestedRadiusMeters,
    ...config,
  };

  // Validate config
  if (fullConfig.durationSec <= 0) {
    throw new Error("Duration must be positive");
  }
  if (fullConfig.fps <= 0) {
    throw new Error("FPS must be positive");
  }

  // Calculate total frames
  const totalFrames = calculateFrameCount(fullConfig.durationSec, fullConfig.fps);

  if (totalFrames === 0) {
    throw new Error("Duration and FPS combination results in zero frames");
  }

  const frames: OrbitFrame[] = [];

  // Generate each frame
  for (let i = 0; i <= totalFrames; i++) {
    const t = calculateProgress(i, totalFrames);
    const frame = generateFrame(i, t, totalFrames, fullConfig);
    frames.push(frame);
  }

  return frames;
}

/**
 * Generate a single frame at the given progress
 */
function generateFrame(
  index: number,
  t: number,
  totalFrames: number,
  config: OrbitConfig
): OrbitFrame {
  // Calculate heading based on progress and easing
  const headingDeg = calculateHeading(
    config.headingStartDeg,
    config.headingEndDeg,
    t,
    config.easing
  );

  return {
    index,
    timeMs: t * config.durationSec * 1000,
    headingRad: degToRad(headingDeg),
    pitchRad: degToRad(config.pitchDeg),
    rangeMeters: config.radiusMeters,
  };
}

/**
 * Get frame at specific time (milliseconds)
 */
export function getFrameAtTime(
  frames: OrbitFrame[],
  timeMs: number
): OrbitFrame | null {
  if (frames.length === 0) return null;

  // Find frame closest to the given time
  for (let i = 0; i < frames.length - 1; i++) {
    if (frames[i].timeMs <= timeMs && frames[i + 1].timeMs > timeMs) {
      return frames[i];
    }
  }

  // Return last frame if time exceeds duration
  return frames[frames.length - 1];
}

/**
 * Get interpolated frame at exact time (for smoother playback)
 */
export function getInterpolatedFrame(
  frames: OrbitFrame[],
  timeMs: number
): OrbitFrame | null {
  if (frames.length === 0) return null;
  if (frames.length === 1) return frames[0];

  // Find bracketing frames
  let prevFrame: OrbitFrame | null = null;
  let nextFrame: OrbitFrame | null = null;

  for (let i = 0; i < frames.length - 1; i++) {
    if (frames[i].timeMs <= timeMs && frames[i + 1].timeMs > timeMs) {
      prevFrame = frames[i];
      nextFrame = frames[i + 1];
      break;
    }
  }

  // Before first frame
  if (!prevFrame && !nextFrame) {
    if (timeMs <= frames[0].timeMs) return frames[0];
    return frames[frames.length - 1];
  }

  if (!prevFrame || !nextFrame) {
    return prevFrame || nextFrame;
  }

  // Interpolate between frames
  const t =
    (timeMs - prevFrame.timeMs) / (nextFrame.timeMs - prevFrame.timeMs);

  return {
    index: prevFrame.index,
    timeMs,
    headingRad: lerp(prevFrame.headingRad, nextFrame.headingRad, t),
    pitchRad: lerp(prevFrame.pitchRad, nextFrame.pitchRad, t),
    rangeMeters: lerp(prevFrame.rangeMeters, nextFrame.rangeMeters, t),
  };
}

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculate orbit statistics
 */
export function getOrbitStats(frames: OrbitFrame[]): {
  totalFrames: number;
  durationMs: number;
  headingRangeDeg: number;
} {
  if (frames.length === 0) {
    return { totalFrames: 0, durationMs: 0, headingRangeDeg: 0 };
  }

  const firstFrame = frames[0];
  const lastFrame = frames[frames.length - 1];

  // Convert radians back to degrees for display
  const headingRangeDeg =
    ((lastFrame.headingRad - firstFrame.headingRad) * 180) / Math.PI;

  return {
    totalFrames: frames.length,
    durationMs: lastFrame.timeMs,
    headingRangeDeg: Math.abs(headingRangeDeg),
  };
}
