import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { verifyPassword } from "@/infra/security/passwordHasher";
import { findAdminByEmail } from "@/infra/repositories/adminRepository";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  adminId: string;
  storeId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Generic message used for ALL credential failures.
// Never reveal which field (email or password) is wrong — prevents enumeration.
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials.";

// A pre-computed Argon2id hash of an arbitrary string.
// Used to run a real hash verification even when the user is not found,
// so the response time is indistinguishable from a wrong-password attempt.
// This prevents timing-based user enumeration.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHRkYXRh$0000000000000000000000000000000000000000000";

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Verifies email + password credentials.
 *
 * Security guarantees:
 * 1. User enumeration prevention — the same generic error message and a
 *    dummy hash comparison run even when the email is not found, making
 *    the response time statistically identical to a wrong-password attempt.
 * 2. Constant-time comparison — delegated to Argon2's internal verify,
 *    which uses a fixed-time algorithm.
 * 3. No field-level hints — "Invalid credentials." is the only message,
 *    regardless of whether email or password failed.
 *
 * Does NOT generate auth tokens — that is the responsibility of the
 * calling layer once this service returns successfully.
 */
export async function login(input: LoginInput): Promise<LoginOutput> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const admin = await findAdminByEmail(normalizedEmail);

  // Always run a real Argon2 verification.
  // When the admin is not found we verify against a dummy hash so the
  // response time is indistinguishable from a real wrong-password attempt.
  const hashToCompare = admin?.passwordHash ?? DUMMY_HASH;
  const passwordMatches = await verifyPassword(input.password, hashToCompare);

  // Single branch covers both "email not found" and "wrong password"
  if (!admin || !passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, HttpStatus.UNAUTHORIZED);
  }

  return {
    adminId: admin.id,
    storeId: admin.storeId,
  };
}
