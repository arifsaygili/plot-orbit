/**
 * TKGM Parcel Query API Configuration
 */

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value;
}

export function getParcelConfig() {
  return {
    /** Static JSON endpoint for province (il) list */
    ilApi: getEnvOrThrow("TKGM_IL_API"),
    /** Base URL for TKGM CBS/MEGSIS API (ilce, mahalle, parsel) */
    cbsApiBase: getEnvOrThrow("TKGM_CBS_API_BASE"),
  };
}

/** Default timeout for upstream API calls in milliseconds */
export const UPSTREAM_TIMEOUT_MS = 10_000;

/** Error codes for parcel API */
export const ParcelErrorCode = {
  MISSING_ENV: "MISSING_ENV",
  UPSTREAM_TIMEOUT: "UPSTREAM_TIMEOUT",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  PARCEL_NOT_FOUND: "PARCEL_NOT_FOUND",
  MISSING_PARAMETER: "MISSING_PARAMETER",
  INVALID_PARAMETER: "INVALID_PARAMETER",
} as const;

export type ParcelErrorCode =
  (typeof ParcelErrorCode)[keyof typeof ParcelErrorCode];
