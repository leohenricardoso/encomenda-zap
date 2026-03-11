import type { CreateStoreOutput, StorePickupAddress } from "./types";

/**
 * Repository interface for Store persistence.
 *
 * Defined in the domain — infrastructure implementations must comply.
 */

export interface CreateStoreWithAdminInput {
  name: string;
  /** URL-safe slug for the public catalog URL: /catalog/:slug */
  slug: string;
  whatsapp: string;
  adminEmail: string;
  /** Pre-hashed password — raw password must NEVER reach the repository. */
  passwordHash: string;
}

export type { CreateStoreOutput };

export interface IStoreRepository {
  /**
   * Atomically creates a Store and its first Admin.
   * If either insert fails (e.g. duplicate email) the whole operation rolls back.
   *
   * Throws AppError(CONFLICT) on duplicate admin email.
   */
  createWithAdmin(input: CreateStoreWithAdminInput): Promise<CreateStoreOutput>;

  /** Returns the store's current WhatsApp number, or null if not found. */
  findById(storeId: string): Promise<{ whatsapp: string } | null>;

  /** Persists a new WhatsApp number for the store. */
  updateWhatsapp(storeId: string, whatsapp: string): Promise<void>;

  /** Returns the store's configured pickup address, or null when not set. */
  findPickupAddress(storeId: string): Promise<StorePickupAddress | null>;

  /** Persists the store's pickup address. Overwrites any existing values. */
  updatePickupAddress(
    storeId: string,
    address: StorePickupAddress,
  ): Promise<void>;

  /** Returns the store's default delivery fee (0 = free delivery). */
  findDefaultDeliveryFee(storeId: string): Promise<number>;

  /** Persists the store's default delivery fee for unrestricted delivery. */
  updateDefaultDeliveryFee(storeId: string, fee: number): Promise<void>;
}
