import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { IStoreScheduleRepository } from "@/domain/schedule/IStoreScheduleRepository";
import type {
  GetScheduleInput,
  GetScheduleResponse,
  ScheduleDay,
} from "@/domain/schedule/StoreSchedule";
import { todayUtc, addDays, dateRange, defaultIsOpen } from "./scheduleHelpers";

const MAX_WINDOW_DAYS = 90;
const DEFAULT_WINDOW_DAYS = 60;

/**
 * GetStoreScheduleUseCase
 *
 * Returns a resolved day-by-day schedule for a date window.
 * For each date in the window it merges the admin override (if any) with the
 * default Mon–Fri open / Sat–Sun closed rule.
 *
 * Constraints:
 * ─ `from` defaults to today (UTC).
 * ─ `to`   defaults to from + 60 days.
 * ─ Window cannot exceed 90 days.
 */
export class GetStoreScheduleUseCase {
  constructor(private readonly repo: IStoreScheduleRepository) {}

  async execute(input: GetScheduleInput): Promise<GetScheduleResponse> {
    const today = todayUtc();
    const from = input.from ?? today;
    const to = input.to ?? addDays(from, DEFAULT_WINDOW_DAYS - 1);

    // ── Validate date format ──────────────────────────────────────────────────
    if (!isValidDate(from)) {
      throw new AppError(
        "Invalid 'from' date. Expected YYYY-MM-DD.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!isValidDate(to)) {
      throw new AppError(
        "Invalid 'to' date. Expected YYYY-MM-DD.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (from > to) {
      throw new AppError(
        "'from' must be before or equal to 'to'.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Window size guard ─────────────────────────────────────────────────────
    const windowSize = dateRange(from, to).length;
    if (windowSize > MAX_WINDOW_DAYS) {
      throw new AppError(
        `Schedule window cannot exceed ${MAX_WINDOW_DAYS} days.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Load all overrides in the window (single query) ───────────────────────
    const overrides = await this.repo.findByDateRange(input.storeId, from, to);
    const overrideMap = new Map(overrides.map((o) => [o.date, o.isOpen]));

    // ── Build resolved schedule ───────────────────────────────────────────────
    const dates = dateRange(from, to);
    const days: ScheduleDay[] = dates.map((date) => {
      const hasOverride = overrideMap.has(date);
      const isOpen = hasOverride
        ? (overrideMap.get(date) as boolean)
        : defaultIsOpen(date);

      return {
        date,
        isOpen,
        isDefault: !hasOverride,
        isEditable: date >= today,
      };
    });

    return { days };
  }
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function isValidDate(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(new Date(`${s}T00:00:00Z`).getTime())
  );
}
