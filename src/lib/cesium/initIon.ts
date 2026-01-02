import { getCesiumConfig } from "./config";

let ionInitialized = false;
let ionError: string | null = null;

export interface IonStatus {
  initialized: boolean;
  enabled: boolean;
  error: string | null;
}

/**
 * Initialize Cesium Ion with access token
 * Should be called once before using Ion features
 */
export async function initIon(
  Cesium: typeof import("cesium")
): Promise<IonStatus> {
  if (ionInitialized) {
    return {
      initialized: true,
      enabled: getCesiumConfig().hasIonToken,
      error: ionError,
    };
  }

  const config = getCesiumConfig();

  if (!config.hasIonToken) {
    console.info(
      "[Cesium] Ion token not configured. Terrain and premium imagery disabled."
    );
    ionInitialized = true;
    return {
      initialized: true,
      enabled: false,
      error: null,
    };
  }

  try {
    Cesium.Ion.defaultAccessToken = config.ionToken!;
    ionInitialized = true;
    console.info("[Cesium] Ion initialized successfully");
    return {
      initialized: true,
      enabled: true,
      error: null,
    };
  } catch (err) {
    ionError = err instanceof Error ? err.message : "Failed to initialize Ion";
    console.error("[Cesium] Ion initialization failed:", ionError);
    ionInitialized = true;
    return {
      initialized: true,
      enabled: false,
      error: ionError,
    };
  }
}

/**
 * Get current Ion status
 */
export function getIonStatus(): IonStatus {
  return {
    initialized: ionInitialized,
    enabled: getCesiumConfig().hasIonToken && !ionError,
    error: ionError,
  };
}

/**
 * Reset Ion state (for testing)
 */
export function resetIon(): void {
  ionInitialized = false;
  ionError = null;
}
