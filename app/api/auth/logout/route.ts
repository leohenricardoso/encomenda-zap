import { clearAuthCookie } from "@/infra/http/cookies/authCookie";
import { ok } from "@/shared/http";

/**
 * POST /api/auth/logout
 * Clears the auth cookie and returns 200.
 * No body validation needed — the act of clearing the cookie is idempotent.
 */
export async function POST() {
  const response = ok({ message: "Signed out." });
  clearAuthCookie(response);
  return response;
}
