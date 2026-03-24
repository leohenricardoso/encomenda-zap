import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreRepository } from "@/domain/store/IStoreRepository";

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * GetStoreIdentityUseCase — returns the store's public-facing name and URL slug.
 *
 * Used by:
 *  - Settings page (pre-fill the identity form)
 *  - Dashboard layout (header + copy-link button)
 */
export class GetStoreIdentityUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(
    storeId: string,
  ): Promise<{ name: string; slug: string | null }> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }

    const identity = await this.storeRepo.findIdentity(storeId);
    if (!identity) {
      throw new AppError("Store not found.", HttpStatus.NOT_FOUND);
    }

    return identity;
  }
}
