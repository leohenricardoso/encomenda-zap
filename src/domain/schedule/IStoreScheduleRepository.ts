import type { StoreSchedule } from "./StoreSchedule";

/**
 * IStoreScheduleRepository — domain port.
 *
 * Stores and retrieves explicit date overrides.
 * Defaults (Mon–Fri open, Sat–Sun closed) are NOT stored in the DB;
 * they are resolved in the application layer.
 *
 * Concrete implementation: PrismaStoreScheduleRepository
 */
export interface IStoreScheduleRepository {
  /**
   * Find all overrides for a store within [from, to] (both inclusive, YYYY-MM-DD).
   */
  findByDateRange(
    storeId: string,
    from: string,
    to: string,
  ): Promise<StoreSchedule[]>;

  /**
   * Find one override by (storeId, date). Returns null when no override exists.
   */
  findByDate(storeId: string, date: string): Promise<StoreSchedule | null>;

  /**
   * Upsert an override for a single date.
   * Creates a row if none exists; updates isOpen if one does.
   */
  upsert(
    storeId: string,
    date: string,
    isOpen: boolean,
  ): Promise<StoreSchedule>;
}
