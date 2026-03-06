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
