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
