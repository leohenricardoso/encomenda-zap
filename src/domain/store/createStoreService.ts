import { Prisma } from "@prisma/client";

import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { hashPassword } from "@/infra/security/passwordHasher";
import { createStoreWithAdmin } from "@/infra/repositories/storeRepository";
import type { CreateStoreInput, CreateStoreOutput } from "./types";

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validate(input: CreateStoreInput): void {
  if (!input.name?.trim()) {
    throw new AppError("Store name is required.", HttpStatus.BAD_REQUEST);
  }

  if (!input.whatsapp?.trim()) {
    throw new AppError("WhatsApp number is required.", HttpStatus.BAD_REQUEST);
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

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Creates a Store and its first Admin atomically.
 *
 * Responsibilities:
 * 1. Validate required fields
 * 2. Hash the raw password — raw password is never passed to the repository
 * 3. Delegate persistence to the repository (wrapped in a Prisma transaction)
 * 4. Map infrastructure errors (e.g. duplicate email) to AppError
 */
export async function createStore(
  input: CreateStoreInput,
): Promise<CreateStoreOutput> {
  validate(input);

  const passwordHash = await hashPassword(input.adminPassword);

  try {
    return await createStoreWithAdmin({
      name: input.name.trim(),
      whatsapp: input.whatsapp.trim(),
      adminEmail: input.adminEmail.trim().toLowerCase(),
      passwordHash,
    });
  } catch (err) {
    // Prisma unique constraint violation (e.g. duplicate admin email)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(
        "An admin with this email already exists.",
        HttpStatus.CONFLICT,
      );
    }
    throw err;
  }
}
