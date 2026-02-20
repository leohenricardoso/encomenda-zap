import * as argon2 from "argon2";

/**
 * Hashes a plain-text password using Argon2id.
 *
 * Argon2id (the recommended hybrid variant) is resistant to:
 * - GPU/ASIC brute-force (memory-hard)
 * - Side-channel attacks (time-hard)
 *
 * Default parameters from the argon2 package are safe for production.
 * Never log or return the raw password.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

/**
 * Verifies a plain-text password against a stored Argon2 hash.
 * Returns true only if the password matches the hash.
 *
 * Safe against timing attacks (constant-time comparison is handled
 * internally by the argon2 library).
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}
