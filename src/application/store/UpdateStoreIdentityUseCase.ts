import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { slugify } from "@/shared/utils/slugify";
import type { IStoreRepository } from "@/domain/store/IStoreRepository";

// ─── Input ────────────────────────────────────────────────────────────────────

export interface UpdateStoreIdentityInput {
  name: string;
  slug: string;
}

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * UpdateStoreIdentityUseCase — allows a store owner to update the store's
 * public-facing name and URL slug.
 *
 * Validation:
 *  - name: 2–100 chars (trimmed)
 *  - slug: slugified form of the input, 3–63 chars, [a-z0-9-] only
 *  - slug must not be in use by another store (uniqueness check)
 */
export class UpdateStoreIdentityUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(
    storeId: string,
    input: UpdateStoreIdentityInput,
  ): Promise<void> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }

    // ── Validate name ────────────────────────────────────────────────────────
    const name = input.name.trim();
    if (!name || name.length < 2 || name.length > 100) {
      throw new AppError(
        "O nome da loja deve ter entre 2 e 100 caracteres.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Validate slug ────────────────────────────────────────────────────────
    const slug = slugify(input.slug.trim());
    if (!slug || slug.length < 3) {
      throw new AppError(
        "O slug deve ter pelo menos 3 caracteres.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
      throw new AppError(
        "O slug deve começar e terminar com letra ou número e conter apenas letras minúsculas, números e hífens.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Uniqueness check ─────────────────────────────────────────────────────
    const taken = await this.storeRepo.isSlugTaken(slug, storeId);
    if (taken) {
      throw new AppError(
        "Este slug já está em uso por outra loja.",
        HttpStatus.CONFLICT,
      );
    }

    await this.storeRepo.updateIdentity(storeId, name, slug);
  }
}
