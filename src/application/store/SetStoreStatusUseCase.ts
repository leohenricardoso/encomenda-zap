import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { StoreStatus } from "@/domain/store/types";

const VALID_STATUSES: StoreStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * SetStoreStatusUseCase — changes the lifecycle status of a store.
 *
 * SUPER ADMIN ONLY.
 * Also keeps the legacy `isActive` flag in sync for backward compatibility.
 */
export class SetStoreStatusUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(id: string, status: string): Promise<void> {
    if (!VALID_STATUSES.includes(status as StoreStatus)) {
      throw new AppError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const store = await this.storeRepo.findStoreById(id);
    if (!store) {
      throw new AppError("Store not found.", HttpStatus.NOT_FOUND);
    }

    await this.storeRepo.updateStoreStatus(id, status as StoreStatus);
  }
}
