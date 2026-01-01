import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAuth, type AuthContext } from "./getAuth";

/**
 * Require authentication for server components and pages.
 * Redirects to login if not authenticated.
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();

  if (!auth) {
    redirect("/login");
  }

  return auth;
}

/**
 * Require authentication for API routes.
 * Returns 401 JSON response if not authenticated.
 * Returns auth context if authenticated.
 */
export async function requireAuthApi(): Promise<
  | { auth: AuthContext; error: null }
  | { auth: null; error: NextResponse }
> {
  const auth = await getAuth();

  if (!auth) {
    return {
      auth: null,
      error: NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  return { auth, error: null };
}
