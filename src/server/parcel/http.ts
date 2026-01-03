/**
 * HTTP utilities for upstream TKGM API calls
 */

import { UPSTREAM_TIMEOUT_MS, ParcelErrorCode } from "./config";

export class UpstreamError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 502
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

/**
 * Fetch with timeout for upstream calls
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "PlotOrbit/1.0",
        ...options.headers,
      },
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new UpstreamError(
        "Upstream service timeout",
        ParcelErrorCode.UPSTREAM_TIMEOUT
      );
    }
    throw new UpstreamError(
      "Failed to connect to upstream service",
      ParcelErrorCode.UPSTREAM_ERROR
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch JSON from upstream with error handling
 */
export async function fetchUpstreamJson<T>(url: string): Promise<T> {
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new UpstreamError(
      `Upstream service returned ${response.status}`,
      ParcelErrorCode.UPSTREAM_ERROR,
      502
    );
  }

  try {
    const data = await response.json();
    return data as T;
  } catch {
    throw new UpstreamError(
      "Invalid JSON response from upstream",
      ParcelErrorCode.INVALID_RESPONSE
    );
  }
}
