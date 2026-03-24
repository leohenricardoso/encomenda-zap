/**
 * IDailyProductionChecklistRepository — domain port.
 *
 * Persists which production items have been marked as "produced" for a given
 * store and date.  The concrete implementation lives in:
 *   src/infra/repositories/PrismaDailyProductionChecklistRepository.ts
 */
export interface IDailyProductionChecklistRepository {
  /**
   * Returns the set of itemKeys that are marked as produced for the given
   * store and date.
   *
   * @param storeId  Tenant identifier.
   * @param date     Calendar date string in YYYY-MM-DD format.
   */
  getProducedKeys(storeId: string, date: string): Promise<Set<string>>;

  /**
   * Toggles the produced state of an item.
   *
   * - If the item is NOT yet produced: creates a row and returns true.
   * - If the item IS already produced: deletes the row and returns false.
   *
   * @param storeId  Tenant identifier.
   * @param date     Calendar date string in YYYY-MM-DD format.
   * @param itemKey  Composite key: "${productId}::${variantId ?? 'no-variant'}"
   * @returns        The new produced state after the toggle.
   */
  toggleItem(storeId: string, date: string, itemKey: string): Promise<boolean>;
}
