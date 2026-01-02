"use client";

import { useMemo } from "react";
import type { RecordFlowState, RecordFlowResult } from "./useRecordFlow";
import { downloadRecording } from "@/client/recording";

interface Props {
  flowState: RecordFlowState;
  progress: number;
  elapsedMs: number;
  durationMs: number;
  error: string | null;
  result: RecordFlowResult | null;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function RecordPanel({
  flowState,
  progress,
  elapsedMs,
  durationMs,
  error,
  result,
  isSupported,
  onStart,
  onStop,
  onReset,
  disabled = false,
}: Props) {
  const isRecording = flowState === "recording";
  const isProcessing = flowState === "processing" || flowState === "uploading";
  const isComplete = flowState === "complete";
  const isError = flowState === "error";
  const isIdle = flowState === "idle";
  const isCreating = flowState === "creating";

  const formattedElapsed = useMemo(() => {
    const seconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, [elapsedMs]);

  const formattedDuration = useMemo(() => {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, [durationMs]);

  const handleDownload = () => {
    if (result) {
      downloadRecording(
        { blob: result.blob, durationMs: result.durationMs, mimeType: "video/webm", objectUrl: result.objectUrl },
        `orbit-video-${result.videoId}.webm`
      );
    }
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl text-white w-72 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-3 h-3 rounded-full ${
            isRecording
              ? "bg-red-500 animate-pulse"
              : isProcessing
              ? "bg-yellow-500 animate-pulse"
              : isComplete
              ? "bg-green-500"
              : isError
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
        />
        <span className="font-medium">
          {isRecording
            ? "Recording"
            : isProcessing
            ? flowState === "uploading"
              ? "Uploading..."
              : "Processing..."
            : isComplete
            ? "Complete"
            : isError
            ? "Error"
            : "Record Video"}
        </span>
      </div>

      {/* Browser not supported */}
      {!isSupported && (
        <div className="bg-red-900/40 border border-red-600/50 rounded px-3 py-2 text-sm text-red-300 mb-4">
          Video recording is not supported in this browser. Please use Chrome, Edge, or Firefox.
        </div>
      )}

      {/* Error message */}
      {isError && error && (
        <div className="bg-red-900/40 border border-red-600/50 rounded px-3 py-2 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Progress during recording */}
      {(isRecording || isCreating) && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{formattedElapsed}</span>
            <span>{formattedDuration}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing/Uploading progress */}
      {isProcessing && (
        <div className="mb-4 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Complete state - preview and download */}
      {isComplete && result && (
        <div className="mb-4 space-y-3">
          <video
            src={result.objectUrl}
            controls
            className="w-full rounded"
            style={{ maxHeight: "150px" }}
          />
          <button
            onClick={handleDownload}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {isIdle && (
          <button
            onClick={onStart}
            disabled={disabled || !isSupported}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-white" />
            Record
          </button>
        )}

        {isRecording && (
          <button
            onClick={onStop}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <div className="w-3 h-3 bg-white" />
            Stop
          </button>
        )}

        {(isComplete || isError) && (
          <button
            onClick={onReset}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            New Recording
          </button>
        )}
      </div>
    </div>
  );
}
