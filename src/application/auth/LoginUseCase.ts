import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IAdminRepository } from "@/domain/auth/IAdminRepository";
import type { IPasswordHasher } from "@/application/ports/IPasswordHasher";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  adminId: string;
  storeId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Generic message — never reveal which field failed (enumeration prevention).
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials.";

// A pre-computed hash of an arbitrary string.
// Run real verification even when the admin is not found, so response time
// is statistically indistinguishable from a wrong-password attempt.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHRkYXRh$0000000000000000000000000000000000000000000";

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * LoginUseCase — verifies email + password credentials.
 *
 * Depends only on domain interfaces. Zero imports from Next.js or Prisma.
 * NestJS migration: decorate with @Injectable() and inject via constructor DI.
 *
 * Security guarantees:
 * 1. User enumeration prevention via dummy hash comparison on unknown email.
 * 2. Constant-time comparison via Argon2's internal verify (delegated to hasher).
 * 3. Single generic error message regardless of which field failed.
 */
export class LoginUseCase {
  constructor(
    private readonly adminRepo: IAdminRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const admin = await this.adminRepo.findByEmail(normalizedEmail);

    // Always run a real hash verify to prevent timing-based enumeration.
    const hashToCompare = admin?.passwordHash ?? DUMMY_HASH;
    const passwordMatches = await this.hasher.verify(
      input.password,
      hashToCompare,
    );

    if (!admin || !passwordMatches) {
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, HttpStatus.UNAUTHORIZED);
    }

    return { adminId: admin.id, storeId: admin.storeId };
  }
}
