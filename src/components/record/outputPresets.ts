/**
 * Output preset types for video recording
 */

export type OutputPresetType = "STANDARD_16_9" | "REELS_9_16";

export interface OutputPreset {
  id: OutputPresetType;
  name: string;
  description: string;
  aspectRatio: string; // CSS aspect-ratio value
  aspectWidth: number;
  aspectHeight: number;
  defaultDurationSec: number;
  defaultFps: number;
  defaultBitrate: number;
  safeArea: {
    topPercent: number;
    bottomPercent: number;
  };
}

/**
 * Standard 16:9 preset (landscape)
 */
export const STANDARD_PRESET: OutputPreset = {
  id: "STANDARD_16_9",
  name: "Standard (16:9)",
  description: "Landscape format for YouTube, websites",
  aspectRatio: "16 / 9",
  aspectWidth: 16,
  aspectHeight: 9,
  defaultDurationSec: 12,
  defaultFps: 30,
  defaultBitrate: 5_000_000, // 5 Mbps
  safeArea: {
    topPercent: 0,
    bottomPercent: 0,
  },
};

/**
 * Instagram Reels 9:16 preset (portrait)
 */
export const REELS_PRESET: OutputPreset = {
  id: "REELS_9_16",
  name: "Reels (9:16)",
  description: "Portrait format for Instagram, TikTok",
  aspectRatio: "9 / 16",
  aspectWidth: 9,
  aspectHeight: 16,
  defaultDurationSec: 12,
  defaultFps: 30,
  defaultBitrate: 4_000_000, // 4 Mbps
  safeArea: {
    topPercent: 8,
    bottomPercent: 18,
  },
};

/**
 * All available output presets
 */
export const OUTPUT_PRESETS: OutputPreset[] = [STANDARD_PRESET, REELS_PRESET];

/**
 * Get preset by ID
 */
export function getOutputPreset(id: OutputPresetType): OutputPreset {
  return id === "REELS_9_16" ? REELS_PRESET : STANDARD_PRESET;
}

/**
 * Default preset
 */
export const DEFAULT_OUTPUT_PRESET: OutputPresetType = "STANDARD_16_9";
