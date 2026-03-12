import type { IStoreRepository } from "@/domain/store/IStoreRepository";

/**
 * GetMinimumAdvanceDaysUseCase
 *
 * Returns the number of days in advance customers must place orders.
 * Falls back to 1 (tomorrow) if the store row is not found.
 */
export class GetMinimumAdvanceDaysUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(storeId: string): Promise<number> {
    return this.storeRepo.findMinimumAdvanceDays(storeId);
  }
}
