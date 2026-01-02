"use client";

import { useState, useCallback } from "react";
import type { OverlayConfig } from "@/client/recording";
import { DEFAULT_REELS_OVERLAY } from "@/client/recording";
import type { OutputPresetType } from "./outputPresets";
import { OUTPUT_PRESETS, getOutputPreset } from "./outputPresets";

type WizardStep = "preset" | "overlay" | "generate";

interface Props {
  outputPreset: OutputPresetType;
  overlayConfig: OverlayConfig;
  onPresetChange: (preset: OutputPresetType) => void;
  onOverlayChange: (config: OverlayConfig) => void;
  onGenerate: () => void;
  disabled?: boolean;
  isRecording?: boolean;
}

/**
 * Reels Wizard - Step-by-step flow for creating Instagram Reels
 */
export function ReelsWizard({
  outputPreset,
  overlayConfig,
  onPresetChange,
  onOverlayChange,
  onGenerate,
  disabled = false,
  isRecording = false,
}: Props) {
  const [step, setStep] = useState<WizardStep>("preset");
  const [isOpen, setIsOpen] = useState(false);

  const currentPreset = getOutputPreset(outputPreset);
  const isReelsMode = outputPreset === "REELS_9_16";

  const handleNext = useCallback(() => {
    if (step === "preset") {
      setStep("overlay");
    } else if (step === "overlay") {
      setStep("generate");
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step === "overlay") {
      setStep("preset");
    } else if (step === "generate") {
      setStep("overlay");
    }
  }, [step]);

  const handleGenerate = useCallback(() => {
    onGenerate();
    setIsOpen(false);
  }, [onGenerate]);

  const handlePresetSelect = useCallback(
    (presetId: OutputPresetType) => {
      onPresetChange(presetId);
      // Initialize overlay config when switching to Reels
      if (presetId === "REELS_9_16") {
        const preset = getOutputPreset(presetId);
        onOverlayChange({
          ...DEFAULT_REELS_OVERLAY,
          safeAreaTopPercent: preset.safeArea.topPercent,
          safeAreaBottomPercent: preset.safeArea.bottomPercent,
        });
      }
    },
    [onPresetChange, onOverlayChange]
  );

  const stepLabels = {
    preset: "1. Format",
    overlay: "2. Overlay",
    generate: "3. Generate",
  };

  const stepIndex = step === "preset" ? 0 : step === "overlay" ? 1 : 2;

  if (isRecording) {
    return null;
  }

  return (
    <div className="relative">
      {/* Wizard Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Create Reels
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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

      {/* Wizard Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl text-white z-50 overflow-hidden">
          {/* Progress Bar */}
          <div className="flex border-b border-gray-700">
            {(["preset", "overlay", "generate"] as WizardStep[]).map(
              (s, index) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  disabled={disabled}
                  className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
                    step === s
                      ? "bg-purple-600 text-white"
                      : index < stepIndex
                      ? "bg-purple-900/50 text-purple-300"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {stepLabels[s]}
                </button>
              )
            )}
          </div>

          {/* Step Content */}
          <div className="p-4">
            {/* Step 1: Format Selection */}
            {step === "preset" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  Choose the output format for your video
                </p>
                {OUTPUT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    disabled={disabled}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      outputPreset === preset.id
                        ? "border-purple-500 bg-purple-900/30"
                        : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-xs text-gray-400">
                        {preset.aspectRatio}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Overlay Configuration */}
            {step === "overlay" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  Add text overlays to your video (optional)
                </p>

                {/* Top Text */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Title / Location
                  </label>
                  <input
                    type="text"
                    value={overlayConfig.topText?.text || ""}
                    onChange={(e) =>
                      onOverlayChange({
                        ...overlayConfig,
                        topText: overlayConfig.topText
                          ? { ...overlayConfig.topText, text: e.target.value }
                          : undefined,
                      })
                    }
                    placeholder="e.g., Istanbul, Turkey"
                    disabled={disabled}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Bottom Text */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={overlayConfig.bottomText?.text || ""}
                    onChange={(e) =>
                      onOverlayChange({
                        ...overlayConfig,
                        bottomText: overlayConfig.bottomText
                          ? { ...overlayConfig.bottomText, text: e.target.value }
                          : undefined,
                      })
                    }
                    placeholder="e.g., Drone Orbit View"
                    disabled={disabled}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {!isReelsMode && (
                  <p className="text-xs text-yellow-500 bg-yellow-900/20 p-2 rounded">
                    Overlays are only available for Reels (9:16) format
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Generate */}
            {step === "generate" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  Review your settings and start recording
                </p>

                {/* Summary */}
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Format:</span>
                    <span>{currentPreset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span>{currentPreset.defaultDurationSec}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">FPS:</span>
                    <span>{currentPreset.defaultFps}</span>
                  </div>
                  {isReelsMode && overlayConfig.topText?.text && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Title:</span>
                      <span className="truncate max-w-32">
                        {overlayConfig.topText.text}
                      </span>
                    </div>
                  )}
                  {isReelsMode && overlayConfig.bottomText?.text && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Description:</span>
                      <span className="truncate max-w-32">
                        {overlayConfig.bottomText.text}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={disabled}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  Start Recording
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between p-4 pt-0">
            {step !== "preset" && (
              <button
                onClick={handleBack}
                disabled={disabled}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            {step !== "generate" && (
              <button
                onClick={handleNext}
                disabled={disabled}
                className="ml-auto px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
