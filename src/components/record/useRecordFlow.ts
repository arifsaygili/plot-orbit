"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Viewer } from "cesium";
import type { OrbitConfig, OrbitTarget } from "@/lib/cesium/orbit";
import { getOrbitController } from "@/lib/cesium/orbit";
import {
  RecordingEngine,
  getRecordingEngine,
  type RecordingResult,
  type RecordingQuality,
  QUALITY_PRESETS,
} from "@/client/recording";
import {
  createVideoIntent,
  updateVideoStatus,
  uploadVideo,
} from "@/client/api/videosClient";
import { getFileExtension } from "@/client/recording";

/**
 * Recording flow state
 */
export type RecordFlowState =
  | "idle"
  | "creating" // Creating video intent
  | "recording" // Recording in progress
  | "processing" // Processing after record stop
  | "uploading" // Uploading to server
  | "complete" // Upload complete
  | "error"; // Error occurred

/**
 * Recording flow configuration
 */
export interface RecordFlowConfig {
  durationSec: number;
  fps: number;
  quality: RecordingQuality;
}

/**
 * Recording flow result
 */
export interface RecordFlowResult {
  videoId: string;
  blob: Blob;
  objectUrl: string;
  durationMs: number;
}

/**
 * Hook return type
 */
export interface UseRecordFlowReturn {
  // State
  flowState: RecordFlowState;
  progress: number; // 0-100
  elapsedMs: number;
  error: string | null;
  result: RecordFlowResult | null;
  isSupported: boolean;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

const DEFAULT_CONFIG: RecordFlowConfig = {
  durationSec: 12,
  fps: 30,
  quality: "medium",
};

/**
 * Hook to manage the complete record flow (intent -> orbit -> record -> upload)
 */
export function useRecordFlow(
  viewer: Viewer | null,
  Cesium: typeof import("cesium") | null,
  target: OrbitTarget | null,
  orbitConfig: OrbitConfig,
  sourceKmlFileId?: string
): UseRecordFlowReturn {
  const [flowState, setFlowState] = useState<RecordFlowState>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecordFlowResult | null>(null);

  const videoIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationMsRef = useRef<number>(0);

  // Check browser support
  const isSupported = RecordingEngine.isSupported();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start recording flow
  const startRecording = useCallback(async () => {
    if (!viewer || !Cesium || !target) {
      setError("Viewer or target not ready");
      return;
    }

    if (!isSupported) {
      setError("Video recording is not supported in this browser");
      return;
    }

    try {
      // Reset state
      setFlowState("creating");
      setProgress(0);
      setElapsedMs(0);
      setError(null);
      setResult(null);

      // Step 1: Create video intent
      const intentResult = await createVideoIntent(sourceKmlFileId);
      if (!intentResult.ok || !intentResult.videoId) {
        throw new Error(intentResult.message || "Failed to create video");
      }

      videoIdRef.current = intentResult.videoId;

      // Step 2: Update status to RECORDING
      await updateVideoStatus(intentResult.videoId, "RECORDING");

      // Step 3: Get canvas
      const canvas = viewer.canvas;
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      // Enable continuous rendering during recording
      viewer.scene.requestRenderMode = false;

      // Step 4: Start orbit animation
      const orbitController = getOrbitController();
      orbitController.initialize(viewer, Cesium);

      const orbitStarted = await orbitController.startOrbit(target, orbitConfig, false);
      if (!orbitStarted) {
        throw new Error("Failed to start orbit animation");
      }

      // Step 5: Start recording
      const recordingEngine = getRecordingEngine();
      const bitsPerSecond = QUALITY_PRESETS[DEFAULT_CONFIG.quality].bitsPerSecond;

      recordingEngine.startRecording(canvas, {
        fps: orbitConfig.fps,
        bitsPerSecond,
      });

      // Update state
      setFlowState("recording");
      durationMsRef.current = orbitConfig.durationSec * 1000;
      startTimeRef.current = performance.now();

      // Start progress timer
      timerRef.current = setInterval(() => {
        const elapsed = performance.now() - startTimeRef.current;
        const prog = Math.min(100, (elapsed / durationMsRef.current) * 100);
        setElapsedMs(elapsed);
        setProgress(prog);

        // Auto-stop when duration reached
        if (elapsed >= durationMsRef.current) {
          handleRecordingComplete();
        }
      }, 100);
    } catch (err) {
      console.error("[useRecordFlow] Error:", err);
      setError(err instanceof Error ? err.message : "Recording failed");
      setFlowState("error");

      // Update video status to FAILED
      if (videoIdRef.current) {
        await updateVideoStatus(videoIdRef.current, "FAILED", {
          errorMessage: err instanceof Error ? err.message : "Recording failed",
        });
      }
    }
  }, [viewer, Cesium, target, orbitConfig, sourceKmlFileId, isSupported]);

  // Handle recording complete (called by timer or manual stop)
  const handleRecordingComplete = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      setFlowState("processing");

      // Stop orbit
      const orbitController = getOrbitController();
      orbitController.stopOrbit();

      // Stop recording
      const recordingEngine = getRecordingEngine();
      const recordingResult: RecordingResult = await recordingEngine.stopRecording();

      // Re-enable request render mode
      if (viewer) {
        viewer.scene.requestRenderMode = true;
      }

      // Update video status to RECORDED
      if (videoIdRef.current) {
        await updateVideoStatus(videoIdRef.current, "RECORDED", {
          durationMs: Math.round(recordingResult.durationMs),
          fps: orbitConfig.fps,
          width: viewer?.canvas.width,
          height: viewer?.canvas.height,
        });
      }

      // Step 6: Upload
      setFlowState("uploading");

      const extension = getFileExtension(recordingResult.mimeType);
      const filename = `video-${videoIdRef.current}.${extension}`;

      const uploadResult = await uploadVideo(
        videoIdRef.current!,
        recordingResult.blob,
        filename
      );

      if (!uploadResult.ok) {
        throw new Error(uploadResult.message || "Upload failed");
      }

      // Complete
      setFlowState("complete");
      setResult({
        videoId: videoIdRef.current!,
        blob: recordingResult.blob,
        objectUrl: recordingResult.objectUrl,
        durationMs: recordingResult.durationMs,
      });
    } catch (err) {
      console.error("[useRecordFlow] Complete error:", err);
      setError(err instanceof Error ? err.message : "Processing failed");
      setFlowState("error");

      if (videoIdRef.current) {
        await updateVideoStatus(videoIdRef.current, "FAILED", {
          errorMessage: err instanceof Error ? err.message : "Processing failed",
        });
      }
    }
  }, [viewer, orbitConfig.fps]);

  // Manual stop
  const stopRecording = useCallback(() => {
    if (flowState === "recording") {
      handleRecordingComplete();
    }
  }, [flowState, handleRecordingComplete]);

  // Reset state
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Cleanup recording engine
    const recordingEngine = getRecordingEngine();
    if (recordingEngine.getIsRecording()) {
      recordingEngine.abort();
    }

    // Stop orbit
    const orbitController = getOrbitController();
    if (orbitController.isRunning()) {
      orbitController.stopOrbit();
    }

    // Revoke object URL if exists
    if (result?.objectUrl) {
      URL.revokeObjectURL(result.objectUrl);
    }

    setFlowState("idle");
    setProgress(0);
    setElapsedMs(0);
    setError(null);
    setResult(null);
    videoIdRef.current = null;
  }, [result]);

  return {
    flowState,
    progress,
    elapsedMs,
    error,
    result,
    isSupported,
    startRecording,
    stopRecording,
    reset,
  };
}
