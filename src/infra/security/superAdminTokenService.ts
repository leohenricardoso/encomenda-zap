import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ─── Config ───────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const raw = process.env.SUPER_ADMIN_JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "SUPER_ADMIN_JWT_SECRET is missing or too short (minimum 32 characters).",
    );
  }
  return new TextEncoder().encode(raw);
}

const ALGORITHM = "HS256";
const DEFAULT_EXPIRY = process.env.SUPER_ADMIN_TOKEN_EXPIRY ?? "8h";

// ─── Payload ─────────────────────────────────────────────────────────────────

export interface SuperAdminSessionPayload extends JWTPayload {
  superAdminId: string;
  /** Discriminator — ensures this token is rejected by the store-admin verifier. */
  role: "SUPER_ADMIN";
}

// ─── sign / verify ────────────────────────────────────────────────────────────

/**
 * Signs a JWT for a super admin session.
 * Uses a completely separate secret from store-admin tokens, preventing
 * any possibility of cross-context token acceptance.
 */
export async function signSuperAdminToken(
  payload: SuperAdminSessionPayload,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(DEFAULT_EXPIRY)
    .sign(getSecret());
}

/**
 * Verifies and decodes a super admin JWT.
 * Throws if the token is expired, tampered, or uses a wrong algorithm.
 */
export async function verifySuperAdminToken(
  token: string,
): Promise<SuperAdminSessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [ALGORITHM],
  });
  return payload as SuperAdminSessionPayload;
}
