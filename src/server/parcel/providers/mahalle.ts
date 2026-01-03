/**
 * Neighborhood (Mahalle) list provider
 */

import { getParcelConfig } from "../config";
import { fetchUpstreamJson } from "../http";
import type { RawAdminListResponse, AdminItem } from "../typesRaw";

/**
 * Fetch list of neighborhoods for a given district
 */
export async function getMahalleList(ilceId: string): Promise<AdminItem[]> {
  const config = getParcelConfig();
  const url = `${config.cbsApiBase}/idariYapi/mahalleListe/${encodeURIComponent(ilceId)}`;
  const raw = await fetchUpstreamJson<RawAdminListResponse>(url);

  if (!raw.features || !Array.isArray(raw.features)) {
    return [];
  }

  return raw.features.map((f) => ({
    id: String(f.properties.id),
    name: f.properties.text,
  }));
}
