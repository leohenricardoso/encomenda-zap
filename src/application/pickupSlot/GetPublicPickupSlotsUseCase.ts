import type { ICatalogRepository } from "@/domain/catalog/ICatalogRepository";
import type { IStorePickupSlotRepository } from "@/domain/pickupSlot/IStorePickupSlotRepository";
import type { ListPickupSlotsResponse } from "@/domain/pickupSlot/StorePickupSlot";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * GetPublicPickupSlotsUseCase
 *
 * Returns the ACTIVE pickup slots for a store identified by its public slug.
 * Designed for the public catalog flow — no authentication required.
 *
 * Uses ICatalogRepository only to resolve slug → storeId and verify the store
 * is active.  Product data returned by that repo is intentionally discarded.
 *
 * Future optimisation: add a lightweight `findStoreBySlug` to ICatalogRepository
 * that returns only `{ storeId, isActive }` without fetching products.
 */
export class GetPublicPickupSlotsUseCase {
  constructor(
    private readonly catalogRepo: ICatalogRepository,
    private readonly pickupSlotRepo: IStorePickupSlotRepository,
  ) {}

  async execute(
    storeSlug: string,
    dayOfWeek?: number,
  ): Promise<ListPickupSlotsResponse> {
    if (!storeSlug?.trim()) {
      throw new AppError("Store slug is required.", HttpStatus.BAD_REQUEST);
    }

    if (dayOfWeek !== undefined) {
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new AppError(
          "dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday).",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Resolve slug → storeId (and confirm store is active)
    const catalog = await this.catalogRepo.findBySlug(
      storeSlug.trim().toLowerCase(),
    );
    if (!catalog) {
      throw new AppError("Store not found.", HttpStatus.NOT_FOUND);
    }

    const slots = await this.pickupSlotRepo.findByStore(catalog.storeId, {
      dayOfWeek,
      activeOnly: true,
    });

    return { slots };
  }
}
