import { NextRequest, NextResponse } from "next/server";
import {
  verifySuperAdminToken,
  type SuperAdminSessionPayload,
} from "@/infra/security/superAdminTokenService";
import { errorResponse } from "@/shared/http/response";
import { HttpStatus } from "@/shared/http/statuses";
import { SA_COOKIE_NAME } from "@/infra/http/cookies/superAdminCookie";

// ─── Augmented request ────────────────────────────────────────────────────────

export interface SuperAdminRequest extends NextRequest {
  superAdminSession: SuperAdminSessionPayload;
}

type SuperAdminHandler = (
  req: SuperAdminRequest,
  ...args: unknown[]
) => Promise<NextResponse>;

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Higher-order function that protects a super-admin API route handler.
 *
 * Reads the super-admin cookie (`sa_token`), verifies it against the
 * SUPER_ADMIN_JWT_SECRET, and attaches the payload as req.superAdminSession.
 * Returns 401 on any auth failure — never leaks the reason.
 *
 * This HOF is intentionally separate from `withAuth` to prevent any possibility
 * of store-admin tokens being accepted on super-admin routes.
 */
export function withSuperAdminAuth(handler: SuperAdminHandler) {
  return async (
    req: NextRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const token = req.cookies.get(SA_COOKIE_NAME)?.value;

    if (!token) {
      return errorResponse("Unauthorized.", HttpStatus.UNAUTHORIZED);
    }

    let superAdminSession: SuperAdminSessionPayload;
    try {
      superAdminSession = await verifySuperAdminToken(token);
    } catch {
      return errorResponse("Unauthorized.", HttpStatus.UNAUTHORIZED);
    }

    const augmented = req as SuperAdminRequest;
    augmented.superAdminSession = superAdminSession;

    return handler(augmented, ...args);
  };
}
