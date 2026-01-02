"use client";

import { useState } from "react";
import type { OverlayConfig, OverlayTextConfig } from "@/client/recording";

interface Props {
  config: OverlayConfig;
  onChange: (config: OverlayConfig) => void;
  disabled?: boolean;
}

/**
 * Panel for configuring overlay text on Reels videos
 */
export function OverlayPanel({ config, onChange, disabled = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateTopText = (updates: Partial<OverlayTextConfig>) => {
    if (!config.topText) return;
    onChange({
      ...config,
      topText: { ...config.topText, ...updates },
    });
  };

  const updateBottomText = (updates: Partial<OverlayTextConfig>) => {
    if (!config.bottomText) return;
    onChange({
      ...config,
      bottomText: { ...config.bottomText, ...updates },
    });
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl text-white w-72">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors rounded-t-lg"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span className="font-medium">Overlay Text</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
        <div className="p-4 pt-0 space-y-4">
          {/* Top Text */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Top Text (Title/Location)
            </label>
            <input
              type="text"
              value={config.topText?.text || ""}
              onChange={(e) => updateTopText({ text: e.target.value })}
              placeholder="e.g., Istanbul, Turkey"
              disabled={disabled}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 placeholder-gray-500"
            />
          </div>

          {/* Bottom Text */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Bottom Text (Description)
            </label>
            <input
              type="text"
              value={config.bottomText?.text || ""}
              onChange={(e) => updateBottomText({ text: e.target.value })}
              placeholder="e.g., Drone Orbit View"
              disabled={disabled}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 placeholder-gray-500"
            />
          </div>

          {/* Text Style Options */}
          <div className="pt-2 border-t border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Text Style</span>
            </div>

            {/* Font Size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Top Size</label>
                <select
                  value={config.topText?.fontSize || 24}
                  onChange={(e) =>
                    updateTopText({ fontSize: parseInt(e.target.value) })
                  }
                  disabled={disabled}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value={18}>Small (18px)</option>
                  <option value={24}>Medium (24px)</option>
                  <option value={32}>Large (32px)</option>
                  <option value={40}>X-Large (40px)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Bottom Size
                </label>
                <select
                  value={config.bottomText?.fontSize || 18}
                  onChange={(e) =>
                    updateBottomText({ fontSize: parseInt(e.target.value) })
                  }
                  disabled={disabled}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value={14}>Small (14px)</option>
                  <option value={18}>Medium (18px)</option>
                  <option value={24}>Large (24px)</option>
                  <option value={32}>X-Large (32px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Safe Area Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
            <div>
              <span className="text-sm">Show Safe Areas</span>
              <p className="text-xs text-gray-500">Preview where text won't be hidden</p>
            </div>
            <button
              onClick={() =>
                onChange({
                  ...config,
                  showSafeAreaGuides: !config.showSafeAreaGuides,
                })
              }
              disabled={disabled}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                config.showSafeAreaGuides
                  ? "bg-purple-600"
                  : "bg-gray-600"
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.showSafeAreaGuides ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Preview hint */}
          <p className="text-xs text-gray-500 italic">
            Text will be burned into the video during recording.
          </p>
        </div>
      )}
    </div>
  );
}
