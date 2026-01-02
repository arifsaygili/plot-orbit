/**
 * Composite Recorder - combines source canvas with overlay and records the result
 */

import type { RecordingConfig, RecordingResult } from "./types";
import { DEFAULT_RECORDING_CONFIG } from "./types";
import { getBestSupportedMimeType, isMediaRecorderSupported } from "./mime";
import { drawOverlay, type OverlayConfig, DEFAULT_REELS_OVERLAY } from "./overlay";

/**
 * CompositeRecorder combines a source canvas (e.g., Cesium) with text overlays
 * and records the composite result.
 */
export class CompositeRecorder {
  private sourceCanvas: HTMLCanvasElement | null = null;
  private compositeCanvas: HTMLCanvasElement | null = null;
  private compositeCtx: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private animationFrameId: number | null = null;
  private resolveStop: ((result: RecordingResult) => void) | null = null;
  private rejectStop: ((error: Error) => void) | null = null;
  private mimeType: string = "";
  private overlayConfig: OverlayConfig = DEFAULT_REELS_OVERLAY;

  /**
   * Check if recording is supported
   */
  static isSupported(): boolean {
    return isMediaRecorderSupported() && getBestSupportedMimeType() !== null;
  }

  /**
   * Initialize composite canvas
   */
  private initCompositeCanvas(width: number, height: number): void {
    this.compositeCanvas = document.createElement("canvas");
    this.compositeCanvas.width = width;
    this.compositeCanvas.height = height;
    this.compositeCtx = this.compositeCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!this.compositeCtx) {
      throw new Error("Failed to get 2D context for composite canvas");
    }
  }

  /**
   * Composite frame: draw source + overlay
   */
  private compositeFrame(): void {
    if (!this.sourceCanvas || !this.compositeCanvas || !this.compositeCtx) {
      return;
    }

    const width = this.compositeCanvas.width;
    const height = this.compositeCanvas.height;

    // Draw source canvas
    this.compositeCtx.drawImage(this.sourceCanvas, 0, 0, width, height);

    // Draw overlay (without guides during recording)
    drawOverlay(this.compositeCtx, this.overlayConfig, width, height, false);
  }

  /**
   * Animation loop for compositing
   */
  private frameLoop = (): void => {
    if (!this.isRecording) return;

    this.compositeFrame();
    this.animationFrameId = requestAnimationFrame(this.frameLoop);
  };

  /**
   * Start composite recording
   */
  startRecording(
    sourceCanvas: HTMLCanvasElement,
    overlayConfig: OverlayConfig,
    config: Partial<RecordingConfig> = {}
  ): void {
    if (this.isRecording) {
      throw new Error("Recording is already in progress");
    }

    if (!CompositeRecorder.isSupported()) {
      throw new Error("MediaRecorder is not supported in this browser");
    }

    const fullConfig: RecordingConfig = {
      ...DEFAULT_RECORDING_CONFIG,
      ...config,
    };

    this.sourceCanvas = sourceCanvas;
    this.overlayConfig = overlayConfig;

    // Initialize composite canvas with source dimensions
    this.initCompositeCanvas(sourceCanvas.width, sourceCanvas.height);

    // Get MIME type
    this.mimeType = fullConfig.mimeType || getBestSupportedMimeType()!;

    // Capture stream from composite canvas
    this.stream = this.compositeCanvas!.captureStream(fullConfig.fps);

    // Create MediaRecorder
    const options: MediaRecorderOptions = {
      mimeType: this.mimeType,
    };

    if (fullConfig.bitsPerSecond) {
      options.videoBitsPerSecond = fullConfig.bitsPerSecond;
    }

    this.mediaRecorder = new MediaRecorder(this.stream, options);
    this.chunks = [];

    // Handle data available
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Handle stop
    this.mediaRecorder.onstop = () => {
      this.handleStop();
    };

    // Handle error
    this.mediaRecorder.onerror = (event: Event) => {
      const errorEvent = event as Event & { error?: DOMException };
      const error = errorEvent.error;
      console.error("[CompositeRecorder] Error:", error);
      if (this.rejectStop) {
        this.rejectStop(new Error(error?.message || "Recording failed"));
      }
      this.cleanup();
    };

    // Start recording
    this.startTime = performance.now();
    this.isRecording = true;
    this.mediaRecorder.start(100);

    // Start compositing loop
    this.frameLoop();

    console.info(
      `[CompositeRecorder] Started - ${fullConfig.fps}fps, ${this.compositeCanvas!.width}x${this.compositeCanvas!.height}`
    );
  }

  /**
   * Update overlay config during recording
   */
  updateOverlay(config: Partial<OverlayConfig>): void {
    this.overlayConfig = { ...this.overlayConfig, ...config };
  }

  /**
   * Stop recording and return result
   */
  stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.resolveStop = resolve;
      this.rejectStop = reject;

      // Stop compositing loop
      this.isRecording = false;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Stop the recorder
      this.mediaRecorder.stop();
    });
  }

  /**
   * Check if recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get elapsed time
   */
  getElapsedMs(): number {
    if (!this.isRecording) return 0;
    return performance.now() - this.startTime;
  }

  /**
   * Handle recording stop
   */
  private handleStop(): void {
    const durationMs = performance.now() - this.startTime;

    const blob = new Blob(this.chunks, { type: this.mimeType });
    const objectUrl = URL.createObjectURL(blob);

    const result: RecordingResult = {
      blob,
      durationMs,
      mimeType: this.mimeType,
      objectUrl,
    };

    console.info(
      `[CompositeRecorder] Stopped - ${Math.round(durationMs)}ms, ${(
        blob.size /
        1024 /
        1024
      ).toFixed(2)}MB`
    );

    if (this.resolveStop) {
      this.resolveStop(result);
    }

    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.sourceCanvas = null;
    this.compositeCanvas = null;
    this.compositeCtx = null;
    this.chunks = [];
    this.isRecording = false;
    this.resolveStop = null;
    this.rejectStop = null;
  }

  /**
   * Abort recording
   */
  abort(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.rejectStop = null;
      this.resolveStop = null;
      this.isRecording = false;
      this.mediaRecorder.stop();
    }
    this.cleanup();
    console.info("[CompositeRecorder] Aborted");
  }
}

// Singleton instance
let compositeInstance: CompositeRecorder | null = null;

/**
 * Get composite recorder singleton
 */
export function getCompositeRecorder(): CompositeRecorder {
  if (!compositeInstance) {
    compositeInstance = new CompositeRecorder();
  }
  return compositeInstance;
}

/**
 * Reset composite recorder
 */
export function resetCompositeRecorder(): void {
  if (compositeInstance) {
    compositeInstance.abort();
    compositeInstance = null;
  }
}
