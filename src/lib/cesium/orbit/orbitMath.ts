import type { EasingType } from "./types";

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Apply easing function to t (0-1)
 */
export function applyEasing(t: number, easing: EasingType): number {
  switch (easing) {
    case "linear":
      return t;
    case "easeIn":
      return t * t;
    case "easeOut":
      return 1 - (1 - t) * (1 - t);
    case "easeInOut":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default:
      return t;
  }
}

/**
 * Calculate heading at a specific time t (0-1) in the orbit
 */
export function calculateHeading(
  headingStartDeg: number,
  headingEndDeg: number,
  t: number,
  easing: EasingType
): number {
  const easedT = applyEasing(t, easing);
  return lerp(headingStartDeg, headingEndDeg, easedT);
}

/**
 * Calculate total frame count for an orbit
 */
export function calculateFrameCount(durationSec: number, fps: number): number {
  return Math.floor(durationSec * fps);
}

/**
 * Calculate time in milliseconds for a specific frame
 */
export function calculateFrameTime(
  frameIndex: number,
  durationSec: number,
  totalFrames: number
): number {
  return (frameIndex / totalFrames) * durationSec * 1000;
}

/**
 * Calculate progress (0-1) for a specific frame
 */
export function calculateProgress(
  frameIndex: number,
  totalFrames: number
): number {
  return frameIndex / totalFrames;
}

/**
 * Calculate camera range considering terrain height
 * Ensures camera stays above ground
 */
export function calculateSafeRange(
  baseRange: number,
  pitchRad: number,
  minHeightAboveGround: number,
  terrainHeight: number = 0
): number {
  // Camera height above target at given range and pitch
  // height = range * sin(-pitch) for negative pitch (looking down)
  const heightAboveTarget = baseRange * Math.sin(-pitchRad);

  // If camera would be below minimum height, adjust range
  if (heightAboveTarget < minHeightAboveGround + terrainHeight) {
    // Calculate new range that puts camera at safe height
    const requiredHeight = minHeightAboveGround + terrainHeight;
    const newRange = requiredHeight / Math.sin(-pitchRad);
    return Math.max(baseRange, newRange);
  }

  return baseRange;
}
