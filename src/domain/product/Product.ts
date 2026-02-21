/**
 * Product domain model — pure TypeScript, no Prisma, no Next.js, no HTTP.
 *
 * Design rationale:
 * ─ A Product is the conceptual item ("Bolo de Chocolate").
 * ─ A ProductVariant is the purchasable option ("500g – R$ 29,90").
 * ─ Simple products (no variants) carry price directly.
 * ─ Products with variants delegate pricing to the variant.
 * ─ minQuantity lives on Product because the minimum order rule applies
 *   regardless of which variant is chosen.
 *
 * Multi-tenancy: storeId is present on BOTH entities so every query
 * remains tenant-scoped even when variants are fetched independently.
 */

// ─── Value objects ────────────────────────────────────────────────────────────

/**
 * How a variant (or a simple product) is priced.
 *   UNIT   — sold by the piece (e.g. "1 Brigadeiro")
 *   WEIGHT — sold by weight (e.g. "500g de Coxinha")
 */
export type PricingType = "UNIT" | "WEIGHT";

// ─── ProductVariant entity ────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  productId: string;
  /** Inherited from the parent product — enables tenant-scoped variant queries */
  storeId: string;
  /**
   * Human-readable option label displayed to the customer.
   * Examples: "P", "M", "G" / "500g", "1kg" / "Chocolate", "Baunilha"
   */
  label: string;
  /** Price for this specific variant in the store currency */
  price: number;
  pricingType: PricingType;
  isActive: boolean;
  /** Display order within the product's variant list (lower = first) */
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Product entity ───────────────────────────────────────────────────────────

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  /**
   * Base price for simple products (no variants).
   * null when the product uses variants — price is on each ProductVariant.
   */
  price: number | null;
  /**
   * Minimum quantity a customer must order.
   * Default 1. Enforced at checkout / order creation.
   */
  minQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Eagerly loaded when requested via findById / findAllByStore */
  variants: ProductVariant[];
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateVariantInput {
  label: string;
  price: number;
  pricingType: PricingType;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateVariantInput {
  label?: string;
  price?: number;
  pricingType?: PricingType;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateProductInput {
  storeId: string;
  name: string;
  description?: string;
  /**
   * Required when creating a simple product (no variants).
   * Omit (or pass undefined) when variants are provided.
   */
  price?: number;
  minQuantity?: number;
  isActive?: boolean;
  variants?: CreateVariantInput[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number | null;
  minQuantity?: number;
  isActive?: boolean;
  /**
   * When provided, ALL existing variants for the product are replaced with
   * this list (delete-then-create in one transaction).
   * Pass an empty array to remove all variants.
   */
  variants?: CreateVariantInput[];
}

/** Safe public shape returned by all use cases and API routes. */
export type ProductResponse = Product;
