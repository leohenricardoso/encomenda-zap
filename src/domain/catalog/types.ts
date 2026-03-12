import type { PricingType } from "@/domain/product/Product";
import type { StorePickupAddress } from "@/domain/store/types";

/**
 * Catalog domain types — public-facing, read-only view of a store's offering.
 *
 * These types intentionally mirror the Product/ProductVariant domain entities
 * but carry only the fields needed for display to end customers.
 * Internal-only fields (e.g. storeId, updatedAt) are omitted.
 *
 * Future: add `imageUrl`, `tags`, and other discovery-relevant fields here.
 */

// ─── Catalog Image ──────────────────────────────────────────────────────────

/**
 * A single image belonging to a catalog product.
 * Ordered by position; position 1 is always the main/primary image.
 */
export interface CatalogImage {
  id: string;
  imageUrl: string;
  position: number;
}

// ─── Catalog Variant ─────────────────────────────────────────────────────────

export interface CatalogVariant {
  id: string;
  label: string;
  price: number;
  pricingType: PricingType;
  /** Base weight quantity for WEIGHT-priced variants (e.g. 250). Null for UNIT. */
  weightValue: number | null;
  /** Unit of weight: "g" or "kg". Null for UNIT variants. */
  weightUnit: string | null;
  isActive: boolean;
  sortOrder: number;
}

// ─── Catalog Product ─────────────────────────────────────────────────────────

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  /**
   * Fixed price for simple products (null = variant-priced).
   * When null, pricing is determined by the selected variant.
   */
  price: number | null;
  minQuantity: number;
  /** Public URL of the main image (position = 1), or null when no images exist. */
  mainImageUrl: string | null;
  /**
   * All images ordered by position (1 = primary, 2 = secondary, 3 = tertiary).
   * Empty array when no images have been uploaded.
   */
  images: CatalogImage[];
  variants: CatalogVariant[];
}

// ─── Store Catalog ────────────────────────────────────────────────────────────

/**
 * The complete public catalog for a store.
 * Returned by GetStoreCatalogUseCase and used by the catalog page.
 */
export interface StoreCatalog {
  storeId: string;
  name: string;
  /** URL slug — matches the :storeSlug route param */
  slug: string;
  /** Store's WhatsApp number (digit string, may include country code 55). */
  whatsapp: string;
  /** Store's physical pickup address, or null when not yet configured. */
  pickupAddress: StorePickupAddress | null;
  /** Default delivery fee applied when delivery is unrestricted (no CEP ranges). */
  defaultDeliveryFee: number;
  /** Minimum number of days in advance customers must place orders (0 = same-day). */
  minimumAdvanceDays: number;
  products: CatalogProduct[];
}
