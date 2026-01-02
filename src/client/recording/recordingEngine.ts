import type { RecordingConfig, RecordingResult } from "./types";
import { DEFAULT_RECORDING_CONFIG } from "./types";
import {
  isMediaRecorderSupported,
  getBestSupportedMimeType,
  getFileExtension,
} from "./mime";

/**
 * Recording Engine - handles canvas capture and MediaRecorder
 */
export class RecordingEngine {
  private canvas: HTMLCanvasElement | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private resolveStop: ((result: RecordingResult) => void) | null = null;
  private rejectStop: ((error: Error) => void) | null = null;
  private mimeType: string = "";

  /**
   * Check if recording is supported
   */
  static isSupported(): boolean {
    return isMediaRecorderSupported() && getBestSupportedMimeType() !== null;
  }

  /**
   * Get the best MIME type
   */
  static getBestMimeType(): string | null {
    return getBestSupportedMimeType();
  }

  /**
   * Start recording from a canvas element
   */
  startRecording(
    canvas: HTMLCanvasElement,
    config: Partial<RecordingConfig> = {}
  ): void {
    if (this.isRecording) {
      throw new Error("Recording is already in progress");
    }

    if (!RecordingEngine.isSupported()) {
      throw new Error("MediaRecorder is not supported in this browser");
    }

    const fullConfig: RecordingConfig = {
      ...DEFAULT_RECORDING_CONFIG,
      ...config,
    };

    // Get MIME type
    this.mimeType = fullConfig.mimeType || getBestSupportedMimeType()!;

    // Capture stream from canvas
    this.canvas = canvas;
    this.stream = canvas.captureStream(fullConfig.fps);

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
      // MediaRecorder error event has an 'error' property
      const errorEvent = event as Event & { error?: DOMException };
      const error = errorEvent.error;
      console.error("[RecordingEngine] Error:", error);
      if (this.rejectStop) {
        this.rejectStop(new Error(error?.message || "Recording failed"));
      }
      this.cleanup();
    };

    // Start recording
    this.startTime = performance.now();
    this.isRecording = true;
    this.mediaRecorder.start(100); // Collect data every 100ms

    console.info(
      `[RecordingEngine] Started recording - ${fullConfig.fps}fps, ${this.mimeType}`
    );
  }

  /**
   * Stop recording and return the result
   */
  stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.resolveStop = resolve;
      this.rejectStop = reject;

      // Stop the recorder - this triggers onstop
      this.mediaRecorder.stop();
    });
  }

  /**
   * Check if recording is in progress
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number {
    if (!this.isRecording) {
      return 0;
    }
    return performance.now() - this.startTime;
  }

  /**
   * Handle recording stop
   */
  private handleStop(): void {
    const durationMs = performance.now() - this.startTime;

    // Create blob from chunks
    const blob = new Blob(this.chunks, { type: this.mimeType });
    const objectUrl = URL.createObjectURL(blob);

    const result: RecordingResult = {
      blob,
      durationMs,
      mimeType: this.mimeType,
      objectUrl,
    };

    console.info(
      `[RecordingEngine] Stopped - ${Math.round(durationMs)}ms, ${(
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
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.canvas = null;
    this.chunks = [];
    this.isRecording = false;
    this.resolveStop = null;
    this.rejectStop = null;
  }

  /**
   * Abort recording without returning result
   */
  abort(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.rejectStop = null; // Don't reject on abort
      this.resolveStop = null;
      this.mediaRecorder.stop();
    }
    this.cleanup();
    console.info("[RecordingEngine] Aborted");
  }
}

// Singleton instance
let engineInstance: RecordingEngine | null = null;

/**
 * Get recording engine singleton
 */
export function getRecordingEngine(): RecordingEngine {
  if (!engineInstance) {
    engineInstance = new RecordingEngine();
  }
  return engineInstance;
}

/**
 * Reset recording engine (for cleanup)
 */
export function resetRecordingEngine(): void {
  if (engineInstance) {
    engineInstance.abort();
    engineInstance = null;
  }
}

/**
 * Create a download link for the recording
 */
export function downloadRecording(result: RecordingResult, filename?: string): void {
  const extension = getFileExtension(result.mimeType);
  const name = filename || `recording-${Date.now()}.${extension}`;

  const a = document.createElement("a");
  a.href = result.objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
