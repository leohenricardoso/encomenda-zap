import type { StoreCepRange } from "./StoreCepRange";

/**
 * IStoreCepRangeRepository — domain port for CEP range persistence.
 *
 * A store can have multiple CEP ranges; a CEP is accepted if it falls
 * within any one of them.
 *
 * The application layer depends on this interface, not on Prisma directly,
 * keeping the domain framework-agnostic.
 */
export interface IStoreCepRangeRepository {
  /** Returns all CEP ranges configured for a store (empty = unrestricted). */
  findByStore(storeId: string): Promise<StoreCepRange[]>;

  /** Adds a new CEP range for a store. */
  create(
    storeId: string,
    cepStart: string,
    cepEnd: string,
  ): Promise<StoreCepRange>;

  /**
   * Removes a specific CEP range by ID.
   * Scoped by storeId to prevent cross-tenant deletion.
   * Silent no-op when the ID doesn't exist or doesn't belong to the store.
   */
  deleteById(id: string, storeId: string): Promise<void>;
}
