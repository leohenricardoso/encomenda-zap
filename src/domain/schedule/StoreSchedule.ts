/**
 * StoreSchedule domain model — pure TypeScript, no Prisma, no Next.js, no HTTP.
 *
 * Design rationale:
 * ─ The table stores ONLY explicit overrides (exceptions) to the default rule.
 * ─ Default rule (applied in the application layer):
 *     Mon–Fri  → isOpen = true
 *     Sat–Sun  → isOpen = false
 * ─ A "schedule day" is the resolved view of one date: default merged with
 *   any stored override.
 *
 * Date representation:
 * ─ All dates are YYYY-MM-DD strings throughout the domain to avoid TZ issues.
 * ─ Conversion to/from Date objects happens only in the infrastructure layer.
 */

// ─── Stored override entity ────────────────────────────────────────────────────

/** Raw DB row — represents an explicit admin override for a single date. */
export interface StoreSchedule {
  id: string;
  storeId: string;
  /** Calendar date, YYYY-MM-DD. */
  date: string;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Resolved view ─────────────────────────────────────────────────────────────

/**
 * ScheduleDay — the full resolved availability of a single date.
 *
 * isDefault: true  → no override stored; value comes from the default rule.
 * isDefault: false → admin has explicitly set this date.
 * isEditable:      → false when the date is in the past (UI/API should reject).
 */
export interface ScheduleDay {
  date: string;
  isOpen: boolean;
  isDefault: boolean;
  isEditable: boolean;
}

// ─── Input / Output types ────────────────────────────────────────────────────

export interface GetScheduleInput {
  storeId: string;
  /** First date of the window — YYYY-MM-DD. Defaults to today. */
  from?: string;
  /** Last date of the window  — YYYY-MM-DD. Defaults to 60 days from `from`. */
  to?: string;
}

export interface SetDayAvailabilityInput {
  storeId: string;
  /** Target date — YYYY-MM-DD. Must not be in the past. */
  date: string;
  isOpen: boolean;
}

export interface GetScheduleResponse {
  days: ScheduleDay[];
}

export interface SetDayAvailabilityResponse {
  day: ScheduleDay;
}
