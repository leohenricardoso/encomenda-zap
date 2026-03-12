import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * UpdateMinimumAdvanceDaysUseCase
 *
 * Sets the minimum number of days in advance customers must place orders.
 *
 * Validation:
 *   - days must be a non-negative integer
 */
export class UpdateMinimumAdvanceDaysUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(storeId: string, days: number): Promise<void> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }
    if (
      typeof days !== "number" ||
      !Number.isFinite(days) ||
      !Number.isInteger(days) ||
      days < 0
    ) {
      throw new AppError(
        "O prazo mínimo deve ser um número inteiro maior ou igual a zero.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.storeRepo.updateMinimumAdvanceDays(storeId, days);
  }
}
