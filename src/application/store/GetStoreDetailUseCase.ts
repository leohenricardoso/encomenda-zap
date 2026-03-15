import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { StoreWithDetails } from "@/domain/store/types";

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * GetStoreDetailUseCase — returns full details for any store by ID.
 *
 * SUPER ADMIN ONLY — unscoped by tenant.
 */
export class GetStoreDetailUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(id: string): Promise<StoreWithDetails> {
    const store = await this.storeRepo.findStoreById(id);
    if (!store) {
      throw new AppError("Store not found.", HttpStatus.NOT_FOUND);
    }
    return store;
  }
}
