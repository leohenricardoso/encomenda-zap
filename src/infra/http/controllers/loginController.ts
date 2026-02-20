import { NextRequest } from "next/server";
import { login } from "@/domain/auth/loginService";
import { signToken } from "@/infra/security/tokenService";
import { setAuthCookie } from "@/infra/http/cookies/authCookie";
import { ok, errorResponse, withErrorHandler } from "@/shared/http";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

/**
 * POST /api/auth/login
 *
 * 1. Parses and size-guards the request body
 * 2. Delegates credential verification to the login service
 * 3. Signs a short-lived JWT with adminId + storeId
 * 4. Attaches the token as an HttpOnly cookie
 * 5. Returns minimal data (no token in body, no hash, no sensitive fields)
 */
export const loginController = withErrorHandler(async (req: unknown) => {
  const request = req as NextRequest;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Invalid JSON body.", HttpStatus.BAD_REQUEST);
  }

  const { email, password } = body;

  if (typeof email === "string" && email.length > MAX_EMAIL_LENGTH) {
    throw new AppError(
      `Email must be at most ${MAX_EMAIL_LENGTH} characters.`,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (typeof password === "string" && password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`,
      HttpStatus.BAD_REQUEST,
    );
  }

  // Credential verification — throws generic AppError(401) on failure
  const { adminId, storeId } = await login({
    email: String(email ?? ""),
    password: String(password ?? ""),
  });

  // Sign JWT — only non-sensitive identifiers
  const token = await signToken({ adminId, storeId });

  // Build response — token goes in the cookie, never in the body
  const response = ok({ adminId, storeId });
  setAuthCookie(response, token);

  return response;
});
