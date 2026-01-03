/**
 * District (İlçe) list provider
 */

import { getParcelConfig } from "../config";
import { fetchUpstreamJson } from "../http";
import type { RawAdminListResponse, AdminItem } from "../typesRaw";

/**
 * Fetch list of districts for a given province
 */
export async function getIlceList(ilId: string): Promise<AdminItem[]> {
  const config = getParcelConfig();
  const url = `${config.cbsApiBase}/idariYapi/ilceListe/${encodeURIComponent(ilId)}`;
  const raw = await fetchUpstreamJson<RawAdminListResponse>(url);

  if (!raw.features || !Array.isArray(raw.features)) {
    return [];
  }

  return raw.features.map((f) => ({
    id: String(f.properties.id),
    name: f.properties.text,
  }));
}
