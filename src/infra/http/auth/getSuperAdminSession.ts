import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  verifySuperAdminToken,
  type SuperAdminSessionPayload,
} from "@/infra/security/superAdminTokenService";
import { SA_COOKIE_NAME } from "@/infra/http/cookies/superAdminCookie";

/**
 * Returns the verified super-admin session payload for use inside Server Components.
 *
 * - Redirects to /admin/login if the session is missing or expired.
 * - Never throws — callers always receive a valid payload or are redirected.
 */
export async function getSuperAdminSession(): Promise<SuperAdminSessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SA_COOKIE_NAME)?.value;

  if (!token) redirect("/admin/login");

  try {
    return await verifySuperAdminToken(token);
  } catch {
    redirect("/admin/login");
  }
}
