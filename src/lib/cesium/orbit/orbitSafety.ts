import type { OrbitConfig, OrbitTarget, SafetyLimits } from "./types";
import { DEFAULT_SAFETY_LIMITS } from "./types";
import { clamp, degToRad } from "./orbitMath";

/**
 * Result of safety validation/fixing
 */
export interface SafetyResult {
  /** The validated/fixed config */
  config: OrbitConfig;
  /** Whether any fixes were applied */
  wasFixed: boolean;
  /** Messages describing what was fixed */
  fixMessages: string[];
}

/**
 * Validate and auto-fix orbit configuration for safety
 */
export function validateAndFixConfig(
  config: OrbitConfig,
  target: OrbitTarget,
  limits: SafetyLimits = DEFAULT_SAFETY_LIMITS
): SafetyResult {
  const fixMessages: string[] = [];
  let wasFixed = false;

  // Clone config to avoid mutation
  const fixedConfig: OrbitConfig = { ...config };

  // Fix duration
  if (fixedConfig.durationSec < limits.minDurationSec) {
    fixedConfig.durationSec = limits.minDurationSec;
    fixMessages.push(`Duration increased to ${limits.minDurationSec}s minimum`);
    wasFixed = true;
  }
  if (fixedConfig.durationSec > limits.maxDurationSec) {
    fixedConfig.durationSec = limits.maxDurationSec;
    fixMessages.push(`Duration reduced to ${limits.maxDurationSec}s maximum`);
    wasFixed = true;
  }

  // Fix FPS
  if (fixedConfig.fps < limits.minFps) {
    fixedConfig.fps = limits.minFps;
    fixMessages.push(`FPS increased to ${limits.minFps} minimum`);
    wasFixed = true;
  }
  if (fixedConfig.fps > limits.maxFps) {
    fixedConfig.fps = limits.maxFps;
    fixMessages.push(`FPS reduced to ${limits.maxFps} maximum`);
    wasFixed = true;
  }

  // Fix radius - use target's suggested radius as reference
  const minRadius = Math.max(limits.minRadiusMeters, target.suggestedRadiusMeters * 0.5);
  if (fixedConfig.radiusMeters < minRadius) {
    fixedConfig.radiusMeters = minRadius;
    fixMessages.push(`Radius increased to ${Math.round(minRadius)}m for safety`);
    wasFixed = true;
  }
  if (fixedConfig.radiusMeters > limits.maxRadiusMeters) {
    fixedConfig.radiusMeters = limits.maxRadiusMeters;
    fixMessages.push(`Radius reduced to ${limits.maxRadiusMeters}m maximum`);
    wasFixed = true;
  }

  // Fix pitch
  if (fixedConfig.pitchDeg < limits.minPitchDeg) {
    fixedConfig.pitchDeg = limits.minPitchDeg;
    fixMessages.push(`Pitch adjusted to ${limits.minPitchDeg}° (too steep)`);
    wasFixed = true;
  }
  if (fixedConfig.pitchDeg > limits.maxPitchDeg) {
    fixedConfig.pitchDeg = limits.maxPitchDeg;
    fixMessages.push(`Pitch adjusted to ${limits.maxPitchDeg}° (too shallow)`);
    wasFixed = true;
  }

  // Check camera height above ground
  const pitchRad = degToRad(fixedConfig.pitchDeg);
  const cameraHeightAboveTarget = fixedConfig.radiusMeters * Math.sin(-pitchRad);
  const estimatedGroundHeight = target.height || 0;
  const cameraAbsoluteHeight = cameraHeightAboveTarget + estimatedGroundHeight;

  if (cameraAbsoluteHeight < limits.minHeightAboveGround) {
    // Increase radius to ensure minimum height
    const requiredRange =
      (limits.minHeightAboveGround - estimatedGroundHeight) / Math.sin(-pitchRad);
    fixedConfig.radiusMeters = Math.max(fixedConfig.radiusMeters, requiredRange);
    fixMessages.push(
      `Radius increased to ${Math.round(fixedConfig.radiusMeters)}m to avoid ground collision`
    );
    wasFixed = true;
  }

  return {
    config: fixedConfig,
    wasFixed,
    fixMessages,
  };
}

/**
 * Check if terrain is enabled and get terrain height at target
 * This is async because it may need to sample terrain
 */
export async function getTerrainHeightAtTarget(
  viewer: import("cesium").Viewer,
  target: OrbitTarget,
  Cesium: typeof import("cesium")
): Promise<number> {
  try {
    const terrainProvider = viewer.terrainProvider;

    // Check if terrain provider supports height sampling
    if (!terrainProvider || !("availability" in terrainProvider)) {
      return 0;
    }

    const positions = [
      Cesium.Cartographic.fromDegrees(target.longitude, target.latitude),
    ];

    const sampledPositions = await Cesium.sampleTerrainMostDetailed(
      terrainProvider,
      positions
    );

    return sampledPositions[0]?.height ?? 0;
  } catch {
    console.warn("[OrbitSafety] Failed to sample terrain height");
    return 0;
  }
}

/**
 * Calculate safe radius considering terrain and camera angle
 */
export function calculateSafeRadius(
  requestedRadius: number,
  pitchDeg: number,
  terrainHeight: number,
  limits: SafetyLimits = DEFAULT_SAFETY_LIMITS
): number {
  const pitchRad = degToRad(pitchDeg);
  const sinPitch = Math.sin(-pitchRad);

  // Avoid division by zero for horizontal camera
  if (sinPitch < 0.1) {
    return requestedRadius;
  }

  // Calculate required radius to maintain minimum height above terrain
  const requiredRadius =
    (limits.minHeightAboveGround + terrainHeight) / sinPitch;

  return Math.max(requestedRadius, requiredRadius, limits.minRadiusMeters);
}

/**
 * Validate config without fixing - returns validation errors
 */
export function validateConfig(
  config: OrbitConfig,
  limits: SafetyLimits = DEFAULT_SAFETY_LIMITS
): string[] {
  const errors: string[] = [];

  if (config.durationSec < limits.minDurationSec) {
    errors.push(`Duration must be at least ${limits.minDurationSec} seconds`);
  }
  if (config.durationSec > limits.maxDurationSec) {
    errors.push(`Duration cannot exceed ${limits.maxDurationSec} seconds`);
  }

  if (config.fps < limits.minFps) {
    errors.push(`FPS must be at least ${limits.minFps}`);
  }
  if (config.fps > limits.maxFps) {
    errors.push(`FPS cannot exceed ${limits.maxFps}`);
  }

  if (config.radiusMeters < limits.minRadiusMeters) {
    errors.push(`Radius must be at least ${limits.minRadiusMeters}m`);
  }
  if (config.radiusMeters > limits.maxRadiusMeters) {
    errors.push(`Radius cannot exceed ${limits.maxRadiusMeters}m`);
  }

  if (config.pitchDeg < limits.minPitchDeg) {
    errors.push(`Pitch cannot be steeper than ${limits.minPitchDeg}°`);
  }
  if (config.pitchDeg > limits.maxPitchDeg) {
    errors.push(`Pitch cannot be shallower than ${limits.maxPitchDeg}°`);
  }

  return errors;
}
