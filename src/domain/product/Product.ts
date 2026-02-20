/**
 * Product entity — pure domain model, no Prisma, no Next.js, no HTTP.
 *
 * Rules:
 * - price is a plain number (repositories are responsible for converting
 *   database Decimal types before exposing this entity)
 * - multi-tenancy: every Product belongs to a Store via storeId
 */

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

/** Safe public shape — same as entity (no sensitive fields on Product). */
export type ProductResponse = Product;
