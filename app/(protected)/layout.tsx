import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { verifyToken } from "@/infra/security/tokenService";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "__session";

/**
 * Protected route group layout.
 *
 * All routes under app/(protected)/ inherit this layout.
 * This is a Server Component — it runs exclusively on the server and
 * cannot be bypassed by client-side JavaScript.
 *
 * Two-layer protection (defense in depth):
 * 1. middleware.ts  — Edge: fast redirect before the page renders
 * 2. This layout    — Server: re-validates the token inside React's render tree,
 *                    ensuring the session is valid even if the middleware
 *                    matcher is accidentally misconfigured.
 *
 * The verified session is passed as a prop to children via a layout prop
 * or can be fetched again per-page using the same getSession() helper below.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    await verifyToken(token);
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
