// ─── Entity ───────────────────────────────────────────────────────────────────
// Pure domain representation — no Prisma types.
// The repository is responsible for mapping Prisma models to this shape.

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  /** Price in the store's currency, e.g. 29.90 */
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateProductInput {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

/** Safe shape returned to API consumers — same as entity (no sensitive fields). */
export type ProductResponse = Product;
