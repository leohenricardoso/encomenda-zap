import type { IStoreCepRangeRepository } from "@/domain/cepRange/IStoreCepRangeRepository";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * DeleteCepRangeUseCase
 *
 * Removes a single CEP range by its ID, scoped to the authenticated store.
 * Silently succeeds when the ID doesn't exist or belongs to another store.
 */
export class DeleteCepRangeUseCase {
  constructor(private readonly repo: IStoreCepRangeRepository) {}

  async execute(id: string, storeId: string): Promise<void> {
    if (!id?.trim()) {
      throw new AppError("Range ID is required.", HttpStatus.BAD_REQUEST);
    }
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }
    await this.repo.deleteById(id, storeId);
  }
}
