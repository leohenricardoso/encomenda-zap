import { NextRequest, NextResponse } from "next/server";
import {
  verifyToken,
  type SessionPayload,
} from "@/infra/security/tokenService";
import { errorResponse } from "@/shared/http/response";
import { HttpStatus } from "@/shared/http/statuses";
import { COOKIE_NAME } from "@/infra/http/cookies/authCookie";

// ─── Augmented request ────────────────────────────────────────────────────────

/**
 * NextRequest extended with the verified session payload.
 * Handlers wrapped by withAuth receive this type instead of plain NextRequest.
 */
export interface AuthenticatedRequest extends NextRequest {
  session: SessionPayload;
}

// ─── Handler type ─────────────────────────────────────────────────────────────

type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  ...args: unknown[]
) => Promise<NextResponse>;

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Higher-order function that protects an API route handler.
 *
 * Usage:
 *   export const GET = withAuth(async (req) => {
 *     const { adminId, storeId } = req.session;
 *     return ok({ storeId });
 *   });
 *
 * Flow:
 * 1. Reads the JWT from the HttpOnly auth cookie
 * 2. Verifies and decodes the token (throws on expiry or tampering)
 * 3. Attaches the decoded SessionPayload to req.session
 * 4. Returns 401 on any auth failure — never leaks the reason
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    req: NextRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return errorResponse("Unauthorized.", HttpStatus.UNAUTHORIZED);
    }

    let session: SessionPayload;
    try {
      session = await verifyToken(token);
    } catch {
      // Covers expired tokens, invalid signatures, wrong algorithm
      return errorResponse("Unauthorized.", HttpStatus.UNAUTHORIZED);
    }

    // Attach session to request (cast is safe — we just verified the payload)
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.session = session;

    return handler(authenticatedReq, ...args);
  };
}
