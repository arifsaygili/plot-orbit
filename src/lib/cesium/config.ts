/**
 * Cesium configuration from environment variables
 */

export interface CesiumConfig {
  ionToken: string | null;
  baseUrl: string;
  hasIonToken: boolean;
}

export function getCesiumConfig(): CesiumConfig {
  const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || null;
  const baseUrl = "/cesium";

  return {
    ionToken,
    baseUrl,
    hasIonToken: !!ionToken && ionToken.length > 0,
  };
}

/**
 * Check if Ion features are available
 */
export function isIonAvailable(): boolean {
  return getCesiumConfig().hasIonToken;
}
