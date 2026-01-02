"use client";

import type { IonStatus } from "@/lib/cesium";

export interface SceneSettings {
  terrainEnabled: boolean;
  imageryPreset: "satellite" | "roadmap";
  qualityPreset: "low" | "medium" | "high";
  buildingsEnabled: boolean;
  lightingEnabled: boolean;
}

interface Props {
  ionStatus: IonStatus;
  settings: SceneSettings;
  onSettingsChange: (settings: SceneSettings) => void;
  isTerrainLoading?: boolean;
}

export function SceneSettingsPanel({
  ionStatus,
  settings,
  onSettingsChange,
  isTerrainLoading,
}: Props) {
  const updateSetting = <K extends keyof SceneSettings>(
    key: K,
    value: SceneSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-64">
      <h3 className="font-semibold text-gray-900 mb-3">Scene Settings</h3>

      {/* Ion Status */}
      <div className="mb-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              ionStatus.enabled ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <span className="text-sm text-gray-600">
            {ionStatus.enabled ? "Ion enabled" : "Ion disabled (fallback)"}
          </span>
        </div>
        {ionStatus.error && (
          <p className="text-xs text-red-500 mt-1">{ionStatus.error}</p>
        )}
      </div>

      {/* Terrain Toggle */}
      <div className="mb-3">
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Terrain</span>
          <div className="flex items-center gap-2">
            {isTerrainLoading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            <input
              type="checkbox"
              checked={settings.terrainEnabled}
              onChange={(e) => updateSetting("terrainEnabled", e.target.checked)}
              disabled={!ionStatus.enabled || isTerrainLoading}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </label>
        {!ionStatus.enabled && (
          <p className="text-xs text-gray-400 mt-1">Requires Ion token</p>
        )}
      </div>

      {/* Imagery Preset */}
      <div className="mb-3">
        <label className="block text-sm text-gray-700 mb-1">Imagery</label>
        <select
          value={settings.imageryPreset}
          onChange={(e) =>
            updateSetting("imageryPreset", e.target.value as "satellite" | "roadmap")
          }
          className="w-full text-sm border rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="satellite">Satellite</option>
          <option value="roadmap">Roadmap</option>
        </select>
      </div>

      {/* Quality Preset */}
      <div className="mb-3">
        <label className="block text-sm text-gray-700 mb-1">Quality</label>
        <select
          value={settings.qualityPreset}
          onChange={(e) =>
            updateSetting("qualityPreset", e.target.value as "low" | "medium" | "high")
          }
          className="w-full text-sm border rounded px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="low">Low (Performance)</option>
          <option value="medium">Medium</option>
          <option value="high">High (Quality)</option>
        </select>
      </div>

      {/* 3D Buildings Toggle */}
      <div className="mb-3">
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-700">3D Buildings</span>
          <input
            type="checkbox"
            checked={settings.buildingsEnabled}
            onChange={(e) => updateSetting("buildingsEnabled", e.target.checked)}
            disabled={!ionStatus.enabled}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
          />
        </label>
        {!ionStatus.enabled && (
          <p className="text-xs text-gray-400 mt-1">Requires Ion token</p>
        )}
      </div>

      {/* Lighting Toggle */}
      <div className="mb-1">
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Lighting</span>
          <input
            type="checkbox"
            checked={settings.lightingEnabled}
            onChange={(e) => updateSetting("lightingEnabled", e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>
      </div>
    </div>
  );
}

export const defaultSceneSettings: SceneSettings = {
  terrainEnabled: true,
  imageryPreset: "satellite",
  qualityPreset: "medium",
  buildingsEnabled: false,
  lightingEnabled: false,
};
