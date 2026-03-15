import type {
  CreateStoreOutput,
  StorePickupAddress,
  StoreStatus,
  ListStoresFilter,
  UpdateStoreInfoInput,
  StoreWithDetails,
  PaginatedStores,
} from "./types";

export interface CreateStoreForAdminInput {
  name: string;
  slug: string;
  whatsapp: string;
  /** If provided, creates an admin account for the store owner. */
  adminEmail?: string;
  /** Pre-hashed password. Required when adminEmail is provided. */
  passwordHash?: string;
}

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
export type {
  StoreStatus,
  ListStoresFilter,
  UpdateStoreInfoInput,
  StoreWithDetails,
  PaginatedStores,
};

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

  /** Returns the minimum number of days in advance customers must place orders. */
  findMinimumAdvanceDays(storeId: string): Promise<number>;

  /** Persists the store's minimum advance days setting. */
  updateMinimumAdvanceDays(storeId: string, days: number): Promise<void>;

  // ─── Super-admin-scoped methods (not tenant-isolated) ────────────────────────

  /**
   * Returns paginated list of ALL stores across all tenants.
   * MUST only be called from super-admin-authenticated code paths.
   */
  listAll(filters: ListStoresFilter): Promise<PaginatedStores>;

  /**
   * Returns full details for any store by ID, unscoped by tenant.
   * MUST only be called from super-admin-authenticated code paths.
   */
  findStoreById(id: string): Promise<StoreWithDetails | null>;

  /**
   * Creates a new store with optional admin credentials.
   * Called by super admin to provision stores without self-registration.
   */
  createStore(input: CreateStoreForAdminInput): Promise<StoreWithDetails>;

  /**
   * Updates editable store info. storeId is the target tenant's ID.
   * MUST only be called from super-admin-authenticated code paths.
   */
  updateStoreInfo(id: string, input: UpdateStoreInfoInput): Promise<void>;

  /**
   * Updates the store's lifecycle status.
   * MUST only be called from super-admin-authenticated code paths.
   */
  updateStoreStatus(id: string, status: StoreStatus): Promise<void>;
}
