import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  verifyToken,
  type SessionPayload,
} from "@/infra/security/tokenService";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "__session";

/**
 * Returns the verified session payload for use inside Server Components.
 *
 * - Call from any Server Component or Server Action inside a protected route.
 * - Redirects to /login if the session is missing or expired.
 * - Never throws — callers always receive a valid SessionPayload or are redirected.
 *
 * @example
 * const session = await getSession();
 * // session.adminId and session.storeId are always defined here
 */
export async function getSession(): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/login");

  try {
    return await verifyToken(token);
  } catch {
    redirect("/login");
  }
}
