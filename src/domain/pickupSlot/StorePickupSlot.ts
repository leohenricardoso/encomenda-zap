/**
 * StorePickupSlot domain model — pure TypeScript, no Prisma, no HTTP.
 *
 * Design rationale:
 * ─ A slot is a recurring weekly window during which customers can schedule
 *   pickup orders (e.g. every Monday 09:00–12:00).
 * ─ Multiple active slots per day are supported (morning + afternoon break).
 * ─ Overlap between active slots for the same store+dayOfWeek is forbidden;
 *   the invariant is enforced in CreatePickupSlotUseCase.
 * ─ isActive = false is a soft-disable — slot is preserved for audit purposes.
 *
 * Time representation:
 * ─ startTime / endTime are "HH:mm" strings (e.g. "09:00", "18:00").
 * ─ Lexicographic string comparison is valid for fixed-width zero-padded times.
 * ─ No Date objects in the domain to avoid timezone leakage.
 *
 * dayOfWeek:
 * ─ Follows JS Date.getDay() convention: 0 = Sunday … 6 = Saturday.
 */

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface StorePickupSlot {
  id: string;
  storeId: string;
  /** 0 = Sunday, 1 = Monday … 6 = Saturday */
  dayOfWeek: number;
  /** Slot opening time – "HH:mm" */
  startTime: string;
  /** Slot closing time – "HH:mm". Always > startTime. */
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Input / Output types ─────────────────────────────────────────────────────

export interface CreatePickupSlotInput {
  storeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface TogglePickupSlotInput {
  id: string;
  storeId: string;
  isActive: boolean;
}

export interface ListPickupSlotsInput {
  storeId: string;
  /** When provided, returns only slots for this dayOfWeek. */
  dayOfWeek?: number;
  /** When true, returns only active slots. Defaults to false (all slots). */
  activeOnly?: boolean;
}

export type PickupSlotResponse = StorePickupSlot;

export interface ListPickupSlotsResponse {
  slots: StorePickupSlot[];
}
