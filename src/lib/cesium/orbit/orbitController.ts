import type { Viewer, Entity } from "cesium";
import type { OrbitConfig, OrbitTarget, OrbitState, OrbitFrame } from "./types";
import { DEFAULT_ORBIT_CONFIG, DEFAULT_SAFETY_LIMITS } from "./types";
import {
  degToRad,
  calculateFrameCount,
  calculateHeading,
  calculateProgress,
} from "./orbitMath";
import {
  validateAndFixConfig,
  getTerrainHeightAtTarget,
  calculateSafeRadius,
} from "./orbitSafety";

/**
 * Orbit Controller - manages deterministic camera orbit around a target
 */
export class OrbitController {
  private viewer: Viewer | null = null;
  private Cesium: typeof import("cesium") | null = null;
  private config: OrbitConfig = DEFAULT_ORBIT_CONFIG;
  private target: OrbitTarget | null = null;
  private state: OrbitState = {
    isRunning: false,
    isPreviewMode: false,
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    autoFixApplied: false,
    autoFixMessage: null,
  };

  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private originalCameraTransform: import("cesium").Matrix4 | null = null;
  private stateChangeCallback: ((state: OrbitState) => void) | null = null;

  /**
   * Initialize the controller with Cesium viewer
   */
  initialize(viewer: Viewer, Cesium: typeof import("cesium")): void {
    this.viewer = viewer;
    this.Cesium = Cesium;
  }

  /**
   * Set callback for state changes
   */
  onStateChange(callback: (state: OrbitState) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * Get current state
   */
  getState(): OrbitState {
    return { ...this.state };
  }

  /**
   * Check if orbit is currently running
   */
  isRunning(): boolean {
    return this.state.isRunning;
  }

  /**
   * Start orbit animation
   */
  async startOrbit(
    target: OrbitTarget,
    config: Partial<OrbitConfig> = {},
    previewMode: boolean = false
  ): Promise<boolean> {
    if (!this.viewer || !this.Cesium) {
      console.error("[OrbitController] Not initialized");
      return false;
    }

    // Merge with defaults
    const fullConfig: OrbitConfig = {
      ...DEFAULT_ORBIT_CONFIG,
      radiusMeters: target.suggestedRadiusMeters,
      ...config,
    };

    // For preview mode, use shorter duration
    if (previewMode) {
      fullConfig.durationSec = 3;
      fullConfig.headingEndDeg = fullConfig.headingStartDeg + 120; // 120° arc
    }

    // Get terrain height at target
    const terrainHeight = await getTerrainHeightAtTarget(
      this.viewer,
      target,
      this.Cesium
    );

    // Validate and fix config
    const safetyResult = validateAndFixConfig(
      fullConfig,
      target,
      DEFAULT_SAFETY_LIMITS
    );

    // Additional terrain-aware radius check
    const safeRadius = calculateSafeRadius(
      safetyResult.config.radiusMeters,
      safetyResult.config.pitchDeg,
      terrainHeight
    );

    if (safeRadius > safetyResult.config.radiusMeters) {
      safetyResult.config.radiusMeters = safeRadius;
      safetyResult.fixMessages.push(
        `Radius increased to ${Math.round(safeRadius)}m for terrain clearance`
      );
      safetyResult.wasFixed = true;
    }

    this.config = safetyResult.config;
    this.target = target;

    // Update state
    this.state = {
      isRunning: true,
      isPreviewMode: previewMode,
      progress: 0,
      currentFrame: 0,
      totalFrames: calculateFrameCount(this.config.durationSec, this.config.fps),
      autoFixApplied: safetyResult.wasFixed,
      autoFixMessage: safetyResult.wasFixed
        ? safetyResult.fixMessages.join("; ")
        : null,
    };
    this.notifyStateChange();

    // Save original camera transform
    this.originalCameraTransform = this.Cesium.Matrix4.clone(
      this.viewer.camera.transform
    );

    // Start animation
    this.startTime = performance.now();
    this.animate();

    console.info(
      `[OrbitController] Started ${previewMode ? "preview" : "orbit"} - ${
        this.config.durationSec
      }s, ${this.config.radiusMeters}m radius`
    );

    return true;
  }

  /**
   * Stop orbit animation
   */
  stopOrbit(): void {
    if (!this.state.isRunning) return;

    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Restore camera transform
    this.restoreCamera();

    // Update state
    this.state = {
      ...this.state,
      isRunning: false,
      isPreviewMode: false,
      progress: 0,
      currentFrame: 0,
    };
    this.notifyStateChange();

    console.info("[OrbitController] Stopped");
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopOrbit();
    this.viewer = null;
    this.Cesium = null;
    this.stateChangeCallback = null;
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.state.isRunning || !this.viewer || !this.Cesium || !this.target) {
      return;
    }

    const elapsed = performance.now() - this.startTime;
    const durationMs = this.config.durationSec * 1000;
    let t = elapsed / durationMs;

    // Check if orbit is complete
    if (t >= 1) {
      if (this.state.isPreviewMode) {
        // Loop in preview mode
        this.startTime = performance.now();
        t = 0;
      } else {
        // Complete the orbit
        this.completeOrbit();
        return;
      }
    }

    // Update state
    this.state.progress = t;
    this.state.currentFrame = Math.floor(t * this.state.totalFrames);
    this.notifyStateChange();

    // Calculate camera position
    this.updateCamera(t);

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Update camera position for time t (0-1)
   */
  private updateCamera(t: number): void {
    if (!this.viewer || !this.Cesium || !this.target) return;

    const Cesium = this.Cesium;

    // Calculate heading for current time
    const headingDeg = calculateHeading(
      this.config.headingStartDeg,
      this.config.headingEndDeg,
      t,
      this.config.easing
    );

    // Convert to radians
    const headingRad = degToRad(headingDeg);
    const pitchRad = degToRad(this.config.pitchDeg);

    // Create target position
    const targetPosition = Cesium.Cartesian3.fromDegrees(
      this.target.longitude,
      this.target.latitude,
      this.target.height + this.config.heightOffsetMeters
    );

    // Create transform centered on target
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(targetPosition);

    // Set camera to look at target with orbit parameters
    this.viewer.camera.lookAtTransform(
      transform,
      new Cesium.HeadingPitchRange(
        headingRad,
        pitchRad,
        this.config.radiusMeters
      )
    );

    // Force render
    this.viewer.scene.requestRender();
  }

  /**
   * Complete the orbit animation
   */
  private completeOrbit(): void {
    // Final camera position at t=1
    this.updateCamera(1);

    // Restore camera freedom
    this.restoreCamera();

    // Update state
    this.state = {
      ...this.state,
      isRunning: false,
      progress: 1,
      currentFrame: this.state.totalFrames,
    };
    this.notifyStateChange();

    console.info("[OrbitController] Orbit completed");
  }

  /**
   * Restore camera to free-look mode
   */
  private restoreCamera(): void {
    if (!this.viewer || !this.Cesium) return;

    // Reset camera transform to identity (free look)
    this.viewer.camera.lookAtTransform(this.Cesium.Matrix4.IDENTITY);
  }

  /**
   * Notify state change callback
   */
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.getState());
    }
  }

  /**
   * Generate all frames for the orbit (for video recording)
   */
  generateFrames(
    target: OrbitTarget,
    config: Partial<OrbitConfig> = {}
  ): OrbitFrame[] {
    const fullConfig: OrbitConfig = {
      ...DEFAULT_ORBIT_CONFIG,
      radiusMeters: target.suggestedRadiusMeters,
      ...config,
    };

    const totalFrames = calculateFrameCount(
      fullConfig.durationSec,
      fullConfig.fps
    );
    const frames: OrbitFrame[] = [];

    for (let i = 0; i <= totalFrames; i++) {
      const t = calculateProgress(i, totalFrames);

      const headingDeg = calculateHeading(
        fullConfig.headingStartDeg,
        fullConfig.headingEndDeg,
        t,
        fullConfig.easing
      );

      frames.push({
        index: i,
        timeMs: (t * fullConfig.durationSec * 1000),
        headingRad: degToRad(headingDeg),
        pitchRad: degToRad(fullConfig.pitchDeg),
        rangeMeters: fullConfig.radiusMeters,
      });
    }

    return frames;
  }
}

// Singleton instance
let controllerInstance: OrbitController | null = null;

/**
 * Get orbit controller singleton
 */
export function getOrbitController(): OrbitController {
  if (!controllerInstance) {
    controllerInstance = new OrbitController();
  }
  return controllerInstance;
}

/**
 * Reset orbit controller (for cleanup)
 */
export function resetOrbitController(): void {
  if (controllerInstance) {
    controllerInstance.dispose();
    controllerInstance = null;
  }
}
