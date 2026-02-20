import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ─── Config ───────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short (minimum 32 characters).",
    );
  }
  return new TextEncoder().encode(raw);
}

const ALGORITHM = "HS256";
const DEFAULT_EXPIRY = process.env.AUTH_TOKEN_EXPIRY ?? "15m";

// ─── Payload ─────────────────────────────────────────────────────────────────

export interface SessionPayload extends JWTPayload {
  adminId: string;
  storeId: string;
}

// ─── sign / verify ────────────────────────────────────────────────────────────

/**
 * Signs a short-lived JWT containing only adminId and storeId.
 * No PII, no roles, no sensitive data embedded in the token.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(DEFAULT_EXPIRY)
    .sign(getSecret());
}

/**
 * Verifies and decodes a JWT.
 * Throws if the token is expired, tampered or uses a wrong algorithm.
 */
export async function verifyToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [ALGORITHM],
  });
  return payload as SessionPayload;
}
