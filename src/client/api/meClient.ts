/**
 * Client API for fetching current user information
 */

import { get } from "@/lib/http";

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface MeResponse {
  ok: boolean;
  user?: CurrentUser;
  error?: string;
}

/**
 * Fetch current authenticated user
 */
export async function getMe(): Promise<MeResponse> {
  const response = await get<{ user: CurrentUser }>("/api/auth/me");

  if (!response.ok || !response.data) {
    return {
      ok: false,
      error: response.error || "Kullanıcı bilgisi alınamadı",
    };
  }

  return {
    ok: true,
    user: response.data.user,
  };
}
