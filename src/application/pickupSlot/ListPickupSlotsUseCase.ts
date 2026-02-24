import type { IStorePickupSlotRepository } from "@/domain/pickupSlot/IStorePickupSlotRepository";
import type {
  ListPickupSlotsInput,
  ListPickupSlotsResponse,
} from "@/domain/pickupSlot/StorePickupSlot";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * ListPickupSlotsUseCase
 *
 * Returns the pickup time slots configured for a store, ordered by
 * dayOfWeek ASC, startTime ASC.
 *
 * Designed for both admin views (all slots) and the public catalog flow
 * (activeOnly + optional dayOfWeek filter).
 */
export class ListPickupSlotsUseCase {
  constructor(private readonly repo: IStorePickupSlotRepository) {}

  async execute(input: ListPickupSlotsInput): Promise<ListPickupSlotsResponse> {
    if (input.dayOfWeek !== undefined) {
      if (
        !Number.isInteger(input.dayOfWeek) ||
        input.dayOfWeek < 0 ||
        input.dayOfWeek > 6
      ) {
        throw new AppError(
          "dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday).",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const slots = await this.repo.findByStore(input.storeId, {
      dayOfWeek: input.dayOfWeek,
      activeOnly: input.activeOnly ?? false,
    });

    return { slots };
  }
}
