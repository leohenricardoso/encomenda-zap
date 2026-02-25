import type { IStoreCepRangeRepository } from "@/domain/cepRange/IStoreCepRangeRepository";
import type { StoreCepRange } from "@/domain/cepRange/StoreCepRange";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * GetCepRangeUseCase
 *
 * Returns all configured delivery CEP ranges for a store.
 * An empty array means delivery is unrestricted (no CEP filter).
 */
export class GetCepRangeUseCase {
  constructor(private readonly repo: IStoreCepRangeRepository) {}

  async execute(storeId: string): Promise<StoreCepRange[]> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }
    return this.repo.findByStore(storeId);
  }
}
