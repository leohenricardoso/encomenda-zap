import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { ISuperAdminRepository } from "@/domain/superAdmin/ISuperAdminRepository";
import type { IPasswordHasher } from "@/application/ports/IPasswordHasher";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface LoginSuperAdminInput {
  email: string;
  password: string;
}

export interface LoginSuperAdminOutput {
  superAdminId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials.";

// Dummy hash — prevents timing attacks when super admin is not found.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHRkYXRh$0000000000000000000000000000000000000000000";

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * LoginSuperAdminUseCase — verifies platform admin credentials.
 *
 * Mirrors the security guarantees of LoginUseCase:
 * - User enumeration prevention via constant-time dummy hash.
 * - Inactive accounts are rejected after verification (avoids timing leak).
 * - Single generic error for all failure modes.
 */
export class LoginSuperAdminUseCase {
  constructor(
    private readonly superAdminRepo: ISuperAdminRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: LoginSuperAdminInput): Promise<LoginSuperAdminOutput> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const superAdmin = await this.superAdminRepo.findByEmail(normalizedEmail);

    const hashToVerify = superAdmin?.passwordHash ?? DUMMY_HASH;
    const passwordMatches = await this.hasher.verify(
      input.password,
      hashToVerify,
    );

    if (!passwordMatches || !superAdmin) {
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, HttpStatus.UNAUTHORIZED);
    }

    if (!superAdmin.isActive) {
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, HttpStatus.UNAUTHORIZED);
    }

    return { superAdminId: superAdmin.id };
  }
}
