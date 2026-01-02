import type { Viewer } from "cesium";

export type QualityPreset = "low" | "medium" | "high";

export interface QualitySettings {
  resolutionScale: number;
  fxaa: boolean;
  msaa: number;
  shadows: boolean;
  hdr: boolean;
  fog: boolean;
}

const presets: Record<QualityPreset, QualitySettings> = {
  low: {
    resolutionScale: 0.75,
    fxaa: false,
    msaa: 1,
    shadows: false,
    hdr: false,
    fog: false,
  },
  medium: {
    resolutionScale: 1.0,
    fxaa: true,
    msaa: 1,
    shadows: false,
    hdr: false,
    fog: true,
  },
  high: {
    resolutionScale: 1.0,
    fxaa: true,
    msaa: 4,
    shadows: true,
    hdr: true,
    fog: true,
  },
};

/**
 * Apply quality preset to viewer
 */
export function applyQualityPreset(
  viewer: Viewer,
  preset: QualityPreset,
  Cesium: typeof import("cesium")
): void {
  const settings = presets[preset];

  // Resolution scale
  viewer.resolutionScale = settings.resolutionScale;

  // Anti-aliasing
  viewer.scene.postProcessStages.fxaa.enabled = settings.fxaa;

  // MSAA (if supported)
  if (viewer.scene.msaaSamples !== undefined) {
    viewer.scene.msaaSamples = settings.msaa;
  }

  // Shadows
  viewer.shadows = settings.shadows;
  viewer.shadowMap.enabled = settings.shadows;

  // HDR
  viewer.scene.highDynamicRange = settings.hdr;

  // Fog
  viewer.scene.fog.enabled = settings.fog;

  console.info(`[Quality] Applied preset: ${preset}`);
}

/**
 * Enable/disable globe lighting
 */
export function setLighting(viewer: Viewer, enabled: boolean): void {
  viewer.scene.globe.enableLighting = enabled;

  if (enabled) {
    // Set a nice default sun position
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(
      new Date().toISOString()
    );
  }

  console.info(`[Quality] Lighting ${enabled ? "enabled" : "disabled"}`);
}

// Re-export Cesium for the setLighting function
import * as Cesium from "cesium";
