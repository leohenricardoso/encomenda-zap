import type { IStorePickupSlotRepository } from "@/domain/pickupSlot/IStorePickupSlotRepository";
import type {
  TogglePickupSlotInput,
  PickupSlotResponse,
} from "@/domain/pickupSlot/StorePickupSlot";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * TogglePickupSlotUseCase
 *
 * Activates or deactivates a pickup slot for a store.
 *
 * Notes:
 * ─ No overlap re-validation needed: deactivating is always safe; reactivating
 *   a slot requires an overlap check against other active slots on the same day.
 * ─ storeId is taken from the session — never from the request body.
 */
export class TogglePickupSlotUseCase {
  constructor(private readonly repo: IStorePickupSlotRepository) {}

  async execute(input: TogglePickupSlotInput): Promise<PickupSlotResponse> {
    if (typeof input.isActive !== "boolean") {
      throw new AppError(
        "'isActive' must be a boolean.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Reactivation overlap check ────────────────────────────────────────────
    if (input.isActive) {
      // Load the slot to know its dayOfWeek and times before re-enabling it
      const target = await this.repo.findById(input.id, input.storeId);
      if (!target) {
        throw new AppError("Pickup slot not found.", HttpStatus.NOT_FOUND);
      }

      // Find all currently active slots for the same day (excluding the target)
      const active = await this.repo.findByStore(input.storeId, {
        dayOfWeek: target.dayOfWeek,
        activeOnly: true,
      });

      for (const slot of active) {
        if (slot.id === target.id) continue; // already inactive, skip
        if (
          slot.startTime < target.endTime &&
          target.startTime < slot.endTime
        ) {
          throw new AppError(
            `Cannot reactivate: slot ${target.startTime}–${target.endTime} would overlap with active slot ${slot.startTime}–${slot.endTime}.`,
            HttpStatus.CONFLICT,
          );
        }
      }
    }

    const updated = await this.repo.setActive(
      input.id,
      input.storeId,
      input.isActive,
    );

    if (!updated) {
      throw new AppError("Pickup slot not found.", HttpStatus.NOT_FOUND);
    }

    return updated;
  }
}
