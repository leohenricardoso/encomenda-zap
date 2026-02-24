import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreScheduleRepository } from "@/domain/schedule/IStoreScheduleRepository";
import type {
  SetDayAvailabilityInput,
  SetDayAvailabilityResponse,
} from "@/domain/schedule/StoreSchedule";
import { todayUtc, isInPast, defaultIsOpen } from "./scheduleHelpers";

/**
 * SetDayAvailabilityUseCase
 *
 * Opens or closes a specific calendar date for a store.
 *
 * Business rules:
 * 1. Dates in the past cannot be changed.
 * 2. If the requested isOpen value matches the default for that day AND no
 *    prior override exists, the operation is a no-op (idempotent, not an error).
 * 3. If an override already exists it is updated (upsert).
 */
export class SetDayAvailabilityUseCase {
  constructor(private readonly repo: IStoreScheduleRepository) {}

  async execute(
    input: SetDayAvailabilityInput,
  ): Promise<SetDayAvailabilityResponse> {
    // ── Validate date format ──────────────────────────────────────────────────
    if (!isValidDate(input.date)) {
      throw new AppError(
        "Invalid date. Expected YYYY-MM-DD.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Past-date guard ───────────────────────────────────────────────────────
    const today = todayUtc();
    if (isInPast(input.date, today)) {
      throw new AppError(
        "Cannot modify availability for a past date.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // ── Validate isOpen type ──────────────────────────────────────────────────
    if (typeof input.isOpen !== "boolean") {
      throw new AppError("'isOpen' must be a boolean.", HttpStatus.BAD_REQUEST);
    }

    // ── Upsert override ───────────────────────────────────────────────────────
    const stored = await this.repo.upsert(
      input.storeId,
      input.date,
      input.isOpen,
    );

    const isDefault = stored.isOpen === defaultIsOpen(input.date);

    return {
      day: {
        date: stored.date,
        isOpen: stored.isOpen,
        isDefault,
        isEditable: stored.date >= today,
      },
    };
  }
}

// ─── Local helper ─────────────────────────────────────────────────────────────

function isValidDate(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(new Date(`${s}T00:00:00Z`).getTime())
  );
}
