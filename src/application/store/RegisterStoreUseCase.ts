import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { IPasswordHasher } from "@/application/ports/IPasswordHasher";
import type { CreateStoreOutput } from "@/domain/store/types";
import { slugify } from "@/shared/utils/slugify";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface RegisterStoreInput {
  name: string;
  whatsapp: string;
  adminEmail: string;
  /** Raw password supplied by the user — hashed before reaching the repository. */
  adminPassword: string;
}

export type { CreateStoreOutput as RegisterStoreOutput };

// ─── Constants ────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * RegisterStoreUseCase — creates a Store and its first Admin atomically.
 *
 * Responsibilities:
 * 1. Validate required fields and business rules (pure, no infra)
 * 2. Hash the raw password — raw password never reaches the repository
 * 3. Delegate persistence to the repository (atomic transaction)
 *
 * This use case never imports Prisma or Next.js.
 * NestJS migration: decorate with @Injectable() and inject via module.
 */
export class RegisterStoreUseCase {
  constructor(
    private readonly storeRepo: IStoreRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: RegisterStoreInput): Promise<CreateStoreOutput> {
    this.validate(input);

    const passwordHash = await this.hasher.hash(input.adminPassword);

    // Repository is responsible for translating infra errors (P2002) to AppError.
    return this.storeRepo.createWithAdmin({
      name: input.name.trim(),
      slug: slugify(input.name),
      whatsapp: input.whatsapp.trim(),
      adminEmail: input.adminEmail.trim().toLowerCase(),
      passwordHash,
    });
  }

  private validate(input: RegisterStoreInput): void {
    if (!input.name?.trim()) {
      throw new AppError("Store name is required.", HttpStatus.BAD_REQUEST);
    }
    if (!input.whatsapp?.trim()) {
      throw new AppError(
        "WhatsApp number is required.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!input.adminEmail?.trim() || !EMAIL_REGEX.test(input.adminEmail)) {
      throw new AppError(
        "A valid admin email is required.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !input.adminPassword ||
      input.adminPassword.length < MIN_PASSWORD_LENGTH
    ) {
      throw new AppError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
