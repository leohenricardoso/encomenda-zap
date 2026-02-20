import argon2 from "argon2";
import type { IPasswordHasher } from "@/application/ports/IPasswordHasher";

/**
 * Argon2PasswordHasher
 *
 * Concrete implementation of IPasswordHasher using Argon2id.
 *
 * Argon2id is the OWASP-recommended algorithm:
 * - Memory-hard (prevents GPU/ASIC brute-force)
 * - Time-hard (configurable iterations)
 * - Hybrid side-channel resistance
 *
 * NestJS migration:
 * - Decorate with @Injectable()
 * - Provide as { provide: IPasswordHasher, useClass: Argon2PasswordHasher }
 *   in the module that needs it (AuthModule, StoreModule)
 */
export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      // Malformed hash — treat as mismatch rather than throwing.
      return false;
    }
  }
}
