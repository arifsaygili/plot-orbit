/**
 * Parcel query provider
 */

import { getParcelConfig, ParcelErrorCode } from "../config";
import { fetchUpstreamJson, UpstreamError } from "../http";
import type { RawParselResponse } from "../typesRaw";

export interface ParselQueryParams {
  mahalleId: string;
  ada: string;
  parsel: string;
}

/**
 * Query a specific parcel by neighborhood ID, ada (block), and parsel (lot) number
 */
export async function queryParsel(
  params: ParselQueryParams
): Promise<RawParselResponse> {
  const config = getParcelConfig();
  const { mahalleId, ada, parsel } = params;

  const url = `${config.cbsApiBase}/parsel/${encodeURIComponent(mahalleId)}/${encodeURIComponent(ada)}/${encodeURIComponent(parsel)}`;
  const raw = await fetchUpstreamJson<RawParselResponse>(url);

  // Check if we got valid geometry
  if (!raw.geometry || !raw.geometry.coordinates) {
    throw new UpstreamError(
      "Parcel not found or has no geometry",
      ParcelErrorCode.PARCEL_NOT_FOUND,
      404
    );
  }

  return raw;
}
