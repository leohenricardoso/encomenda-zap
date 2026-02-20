import { type NextResponse } from "next/server";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "__session";

// 24 hours in seconds — matches token expiry
const COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * Attaches the auth cookie to a NextResponse.
 *
 * Security flags:
 * - httpOnly    → JavaScript cannot read the cookie (XSS mitigation)
 * - secure      → Cookie sent only over HTTPS in production
 * - sameSite=lax → Blocks cross-site POST requests (CSRF mitigation)
 *                  "lax" (not "strict") allows top-level navigations (e.g. OAuth redirects)
 * - path=/       → Cookie scoped to all routes
 * - maxAge       → Explicit expiry; no persistent cookie in the browser if omitted
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Clears the auth cookie (used on logout).
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME };
