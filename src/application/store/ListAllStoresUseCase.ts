import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { ListStoresFilter, PaginatedStores } from "@/domain/store/types";

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * ListAllStoresUseCase — returns a paginated list of ALL stores in the platform.
 *
 * SUPER ADMIN ONLY — not tenant-scoped.
 * Must only be called from super-admin-authenticated routes.
 */
export class ListAllStoresUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(filters: ListStoresFilter): Promise<PaginatedStores> {
    return this.storeRepo.listAll(filters);
  }
}
