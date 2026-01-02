"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Viewer } from "cesium";
import type { OrbitConfig, OrbitTarget, OrbitState } from "@/lib/cesium/orbit";
import {
  getOrbitController,
  resetOrbitController,
  DEFAULT_ORBIT_CONFIG,
} from "@/lib/cesium/orbit";
import { getPresetConfig, DEFAULT_PRESET_ID } from "./orbitPresets";

/**
 * Hook return type
 */
export interface UseOrbitReturn {
  // State
  orbitState: OrbitState;
  config: OrbitConfig;
  presetId: string;

  // Actions
  setPreset: (presetId: string) => void;
  updateConfig: (updates: Partial<OrbitConfig>) => void;
  startOrbit: () => Promise<boolean>;
  startPreview: () => Promise<boolean>;
  stopOrbit: () => void;
  resetConfig: () => void;
}

/**
 * Default orbit state
 */
const DEFAULT_STATE: OrbitState = {
  isRunning: false,
  isPreviewMode: false,
  progress: 0,
  currentFrame: 0,
  totalFrames: 0,
  autoFixApplied: false,
  autoFixMessage: null,
};

/**
 * Hook to manage orbit animation state and control
 */
export function useOrbit(
  viewer: Viewer | null,
  Cesium: typeof import("cesium") | null,
  target: OrbitTarget | null
): UseOrbitReturn {
  const [orbitState, setOrbitState] = useState<OrbitState>(DEFAULT_STATE);
  const [presetId, setPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [config, setConfig] = useState<OrbitConfig>(() => ({
    ...DEFAULT_ORBIT_CONFIG,
    radiusMeters: target?.suggestedRadiusMeters || DEFAULT_ORBIT_CONFIG.radiusMeters,
  }));

  const controllerInitialized = useRef(false);

  // Initialize controller when viewer is ready
  useEffect(() => {
    if (viewer && Cesium && !controllerInitialized.current) {
      const controller = getOrbitController();
      controller.initialize(viewer, Cesium);
      controller.onStateChange(setOrbitState);
      controllerInitialized.current = true;
    }

    return () => {
      resetOrbitController();
      controllerInitialized.current = false;
    };
  }, [viewer, Cesium]);

  // Update config when target changes
  useEffect(() => {
    if (target) {
      setConfig((prev) => ({
        ...prev,
        radiusMeters: target.suggestedRadiusMeters,
      }));
    }
  }, [target?.suggestedRadiusMeters]);

  // Set preset
  const setPreset = useCallback(
    (newPresetId: string) => {
      setPresetId(newPresetId);
      if (newPresetId !== "custom") {
        const presetConfig = getPresetConfig(
          newPresetId,
          target?.suggestedRadiusMeters || config.radiusMeters
        );
        setConfig(presetConfig);
      }
    },
    [target?.suggestedRadiusMeters, config.radiusMeters]
  );

  // Update config (switches to custom preset)
  const updateConfig = useCallback((updates: Partial<OrbitConfig>) => {
    setPresetId("custom");
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Start orbit
  const startOrbit = useCallback(async (): Promise<boolean> => {
    if (!target) {
      console.warn("[useOrbit] No target available");
      return false;
    }

    const controller = getOrbitController();
    return controller.startOrbit(target, config, false);
  }, [target, config]);

  // Start preview (3s loop)
  const startPreview = useCallback(async (): Promise<boolean> => {
    if (!target) {
      console.warn("[useOrbit] No target available");
      return false;
    }

    const controller = getOrbitController();
    return controller.startOrbit(target, config, true);
  }, [target, config]);

  // Stop orbit
  const stopOrbit = useCallback(() => {
    const controller = getOrbitController();
    controller.stopOrbit();
  }, []);

  // Reset to default
  const resetConfig = useCallback(() => {
    setPresetId(DEFAULT_PRESET_ID);
    setConfig({
      ...getPresetConfig(
        DEFAULT_PRESET_ID,
        target?.suggestedRadiusMeters || DEFAULT_ORBIT_CONFIG.radiusMeters
      ),
    });
  }, [target?.suggestedRadiusMeters]);

  return {
    orbitState,
    config,
    presetId,
    setPreset,
    updateConfig,
    startOrbit,
    startPreview,
    stopOrbit,
    resetConfig,
  };
}
