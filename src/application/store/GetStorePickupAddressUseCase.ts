import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import type { StorePickupAddress } from "@/domain/store/types";

/**
 * GetStorePickupAddressUseCase — returns the store's configured pickup address.
 * Returns null when the address has not been set up yet.
 */
export class GetStorePickupAddressUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(storeId: string): Promise<StorePickupAddress | null> {
    return this.storeRepo.findPickupAddress(storeId);
  }
}
