"use client";

import { useState, useMemo } from "react";
import type { OrbitConfig, OrbitState } from "@/lib/cesium/orbit";
import { DEFAULT_SAFETY_LIMITS } from "@/lib/cesium/orbit";
import { ORBIT_PRESETS } from "./orbitPresets";

interface Props {
  config: OrbitConfig;
  orbitState: OrbitState;
  presetId: string;
  onPresetChange: (presetId: string) => void;
  onConfigChange: (updates: Partial<OrbitConfig>) => void;
  onStart: () => void;
  onPreview: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function OrbitPanel({
  config,
  orbitState,
  presetId,
  onPresetChange,
  onConfigChange,
  onStart,
  onPreview,
  onStop,
  onReset,
  disabled = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const limits = DEFAULT_SAFETY_LIMITS;

  const progressPercent = useMemo(() => {
    return Math.round(orbitState.progress * 100);
  }, [orbitState.progress]);

  const isCustomPreset = presetId === "custom";

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl text-white w-72">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="font-medium">Orbit Controls</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Progress bar (when running) */}
          {orbitState.isRunning && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {orbitState.isPreviewMode ? "Preview" : "Orbit"} Progress
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Auto-fix message */}
          {orbitState.autoFixApplied && orbitState.autoFixMessage && (
            <div className="bg-yellow-900/40 border border-yellow-600/50 rounded px-3 py-2 text-xs text-yellow-300">
              <span className="font-medium">Auto-adjusted:</span>{" "}
              {orbitState.autoFixMessage}
            </div>
          )}

          {/* Preset selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Preset</label>
            <select
              value={presetId}
              onChange={(e) => onPresetChange(e.target.value)}
              disabled={disabled || orbitState.isRunning}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {ORBIT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <label>Duration</label>
              <span>{config.durationSec}s</span>
            </div>
            <input
              type="range"
              min={limits.minDurationSec}
              max={limits.maxDurationSec}
              step={1}
              value={config.durationSec}
              onChange={(e) =>
                onConfigChange({ durationSec: Number(e.target.value) })
              }
              disabled={disabled || orbitState.isRunning}
              className="w-full accent-blue-500 disabled:opacity-50"
            />
          </div>

          {/* FPS */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <label>FPS</label>
              <span>{config.fps}</span>
            </div>
            <input
              type="range"
              min={limits.minFps}
              max={limits.maxFps}
              step={5}
              value={config.fps}
              onChange={(e) => onConfigChange({ fps: Number(e.target.value) })}
              disabled={disabled || orbitState.isRunning}
              className="w-full accent-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Radius */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <label>Radius</label>
              <span>{Math.round(config.radiusMeters)}m</span>
            </div>
            <input
              type="range"
              min={limits.minRadiusMeters}
              max={Math.min(limits.maxRadiusMeters, config.radiusMeters * 3)}
              step={50}
              value={config.radiusMeters}
              onChange={(e) =>
                onConfigChange({ radiusMeters: Number(e.target.value) })
              }
              disabled={disabled || orbitState.isRunning}
              className="w-full accent-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Pitch */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <label>Pitch</label>
              <span>{config.pitchDeg}°</span>
            </div>
            <input
              type="range"
              min={limits.minPitchDeg}
              max={limits.maxPitchDeg}
              step={5}
              value={config.pitchDeg}
              onChange={(e) =>
                onConfigChange({ pitchDeg: Number(e.target.value) })
              }
              disabled={disabled || orbitState.isRunning}
              className="w-full accent-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Start Heading (only in custom mode) */}
          {isCustomPreset && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <label>Start Heading</label>
                <span>{config.headingStartDeg}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={359}
                step={15}
                value={config.headingStartDeg}
                onChange={(e) =>
                  onConfigChange({
                    headingStartDeg: Number(e.target.value),
                    headingEndDeg: Number(e.target.value) + 360,
                  })
                }
                disabled={disabled || orbitState.isRunning}
                className="w-full accent-blue-500 disabled:opacity-50"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {orbitState.isRunning ? (
              <button
                onClick={onStop}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Stop
              </button>
            ) : (
              <>
                <button
                  onClick={onPreview}
                  disabled={disabled}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
                <button
                  onClick={onStart}
                  disabled={disabled}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start
                </button>
              </>
            )}
          </div>

          {/* Reset button */}
          {!orbitState.isRunning && isCustomPreset && (
            <button
              onClick={onReset}
              disabled={disabled}
              className="w-full text-sm text-gray-400 hover:text-white py-1 transition-colors disabled:opacity-50"
            >
              Reset to Standard
            </button>
          )}
        </div>
      )}
    </div>
  );
}
