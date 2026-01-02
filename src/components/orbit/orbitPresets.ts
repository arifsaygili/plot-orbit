import type { OrbitConfig } from "@/lib/cesium/orbit";
import { DEFAULT_ORBIT_CONFIG } from "@/lib/cesium/orbit";

/**
 * Orbit preset definition
 */
export interface OrbitPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<OrbitConfig>;
}

/**
 * Available orbit presets
 */
export const ORBIT_PRESETS: OrbitPreset[] = [
  {
    id: "fast",
    name: "Fast (8s)",
    description: "Quick overview of the area",
    config: {
      durationSec: 8,
      fps: 30,
      pitchDeg: -25,
    },
  },
  {
    id: "standard",
    name: "Standard (12s)",
    description: "Balanced view with good detail",
    config: {
      durationSec: 12,
      fps: 30,
      pitchDeg: -30,
    },
  },
  {
    id: "cinematic",
    name: "Cinematic (20s)",
    description: "Slow, dramatic overview",
    config: {
      durationSec: 20,
      fps: 30,
      pitchDeg: -35,
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Manually configure all parameters",
    config: {},
  },
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): OrbitPreset | undefined {
  return ORBIT_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get full config from a preset ID
 */
export function getPresetConfig(
  presetId: string,
  suggestedRadius: number
): OrbitConfig {
  const preset = getPresetById(presetId);
  return {
    ...DEFAULT_ORBIT_CONFIG,
    radiusMeters: suggestedRadius,
    ...(preset?.config || {}),
  };
}

/**
 * Default preset ID
 */
export const DEFAULT_PRESET_ID = "standard";
