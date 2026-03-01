import type { StoreMessageConfig } from "./StoreMessageConfig";

/**
 * IStoreMessageRepository — persistence contract for StoreMessageConfig.
 *
 * Designed for a single-row-per-store model (1:1).
 * Both read and write are upsert-friendly (no separate "create" method).
 */
export interface IStoreMessageRepository {
  /**
   * Returns the message config for a store, or null if never configured.
   * Callers should fall back to DEFAULT_MESSAGES when null is returned.
   */
  findByStore(storeId: string): Promise<StoreMessageConfig | null>;

  /**
   * Inserts or overwrites the message config for the given store.
   * storeId on the input is the upsert key.
   */
  upsert(config: StoreMessageConfig): Promise<StoreMessageConfig>;
}
