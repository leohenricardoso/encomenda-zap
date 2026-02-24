import type { IStorePickupSlotRepository } from "@/domain/pickupSlot/IStorePickupSlotRepository";
import type {
  CreatePickupSlotInput,
  PickupSlotResponse,
} from "@/domain/pickupSlot/StorePickupSlot";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

// HH:mm regex — accepts 00:00 to 23:59
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * CreatePickupSlotUseCase
 *
 * Validates and persists a new recurring weekly pickup time window.
 *
 * Business rules:
 * 1. dayOfWeek must be 0–6 (Sun–Sat).
 * 2. startTime and endTime must follow HH:mm; endTime > startTime.
 * 3. The new slot must not overlap with any ACTIVE slot for the same
 *    store+dayOfWeek.
 *    Overlap condition: A < D && C < B
 *    where [A,B] is existing and [C,D] is the candidate.
 *    Adjacent slots (B == C) are NOT considered overlapping.
 */
export class CreatePickupSlotUseCase {
  constructor(private readonly repo: IStorePickupSlotRepository) {}

  async execute(input: CreatePickupSlotInput): Promise<PickupSlotResponse> {
    // ── dayOfWeek ────────────────────────────────────────────────────────────
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

    // ── Time format ──────────────────────────────────────────────────────────
    if (!TIME_RE.test(input.startTime)) {
      throw new AppError(
        "startTime must be in HH:mm format (e.g. '09:00').",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!TIME_RE.test(input.endTime)) {
      throw new AppError(
        "endTime must be in HH:mm format (e.g. '18:00').",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── endTime > startTime ──────────────────────────────────────────────────
    if (input.endTime <= input.startTime) {
      throw new AppError(
        "endTime must be strictly after startTime.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Overlap check against active slots for the same store + dayOfWeek ───
    const existing = await this.repo.findByStore(input.storeId, {
      dayOfWeek: input.dayOfWeek,
      activeOnly: true,
    });

    for (const slot of existing) {
      // Overlap: slot.startTime < input.endTime  AND  input.startTime < slot.endTime
      if (slot.startTime < input.endTime && input.startTime < slot.endTime) {
        throw new AppError(
          `The slot ${input.startTime}–${input.endTime} overlaps with an existing active slot (${slot.startTime}–${slot.endTime}).`,
          HttpStatus.CONFLICT,
        );
      }
    }

    return this.repo.create(
      input.storeId,
      input.dayOfWeek,
      input.startTime,
      input.endTime,
    );
  }
}
