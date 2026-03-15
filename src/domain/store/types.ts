// ─── Store Status ─────────────────────────────────────────────────────────────

/**
 * Lifecycle status of a store in the platform.
 *
 * ACTIVE     — fully operational; catalog is public and accepts orders.
 * INACTIVE   — store is disabled by super admin; catalog is hidden.
 * SUSPENDED  — store is suspended (e.g. payment failure); catalog shows a
 *              suspension notice instead of the order form.
 */
export type StoreStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

// ─── Super-admin scoped store types ──────────────────────────────────────────

export interface ListStoresFilter {
  status?: StoreStatus;
  /** Case-insensitive partial match on store name. */
  search?: string;
  page?: number;
  /** Items per page (default 20). */
  limit?: number;
}

export interface UpdateStoreInfoInput {
  name?: string;
  slug?: string;
  whatsapp?: string;
}

/** Full store detail returned by super-admin queries. */
export interface StoreWithDetails {
  id: string;
  name: string;
  slug: string | null;
  whatsapp: string;
  status: StoreStatus;
  isActive: boolean;
  createdAt: Date;
  adminEmail: string | null;
}

export interface PaginatedStores {
  stores: StoreWithDetails[];
  total: number;
  page: number;
  limit: number;
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateStoreInput {
  /** Display name of the store (e.g. "Doces da Maria"). */
  name: string;
  /** WhatsApp number that receives orders (e.g. "5511999998888"). */
  whatsapp: string;
  /** Email for the first admin account. */
  adminEmail: string;
  /** Raw password — will be hashed by the service before persistence. */
  adminPassword: string;
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

export interface CreateStoreOutput {
  storeId: string;
  adminId: string;
}

// ─── Pickup Address ─────────────────────────────────────────────────────────

/**
 * Store's physical pickup address — configured by the storeowner in settings.
 * All primary fields are required when present; complement and reference are optional.
 */
export interface StorePickupAddress {
  locationName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  complement: string | null;
  reference: string | null;
}
