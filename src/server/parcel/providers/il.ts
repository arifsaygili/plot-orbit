/**
 * Province (İl) list provider
 */

import { getParcelConfig } from "../config";
import { fetchUpstreamJson } from "../http";
import type { RawAdminListResponse, AdminItem } from "../typesRaw";

/**
 * Fetch list of all provinces from TKGM
 */
export async function getIlList(): Promise<AdminItem[]> {
  const config = getParcelConfig();
  const raw = await fetchUpstreamJson<RawAdminListResponse>(config.ilApi);

  if (!raw.features || !Array.isArray(raw.features)) {
    return [];
  }

  return raw.features.map((f) => ({
    id: String(f.properties.id),
    name: f.properties.text,
  }));
}
