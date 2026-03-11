import type { IStoreRepository } from "@/domain/store/IStoreRepository";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * UpdateDefaultDeliveryFeeUseCase
 *
 * Sets the store's default delivery fee applied when delivery is unrestricted
 * (i.e. no CEP ranges are configured).
 *
 * Validation:
 *   - fee must be a finite number >= 0
 */
export class UpdateDefaultDeliveryFeeUseCase {
  constructor(private readonly storeRepo: IStoreRepository) {}

  async execute(storeId: string, fee: number): Promise<void> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }
    if (typeof fee !== "number" || !Number.isFinite(fee) || fee < 0) {
      throw new AppError(
        "Taxa de entrega deve ser um valor positivo.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.storeRepo.updateDefaultDeliveryFee(storeId, fee);
  }
}
