import { type NextResponse } from "next/server";

export const SA_COOKIE_NAME = process.env.SA_COOKIE_NAME ?? "__sa_session";

// 8 hours in seconds
const COOKIE_MAX_AGE = 60 * 60 * 8;

/**
 * Attaches the super-admin auth cookie to a NextResponse.
 *
 * Uses a separate cookie name from the store-admin cookie (__session)
 * to prevent any cross-context cookie reuse.
 */
export function setSuperAdminCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(SA_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Clears the super-admin auth cookie on logout.
 */
export function clearSuperAdminCookie(response: NextResponse): void {
  response.cookies.set(SA_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
