// Server-side parcel query services
export { getParcelConfig, ParcelErrorCode, UPSTREAM_TIMEOUT_MS } from "./config";
export { UpstreamError } from "./http";
export {
  getIlList,
  getIlceList,
  getMahalleList,
  queryParsel,
  type ParselQueryParams,
} from "./providers";
export { normalizeParcelResponse, type NormalizeParams } from "./normalize";
export type {
  AdminItem,
  ParcelResult,
  RawAdminFeature,
  RawAdminListResponse,
  RawParselResponse,
} from "./typesRaw";
