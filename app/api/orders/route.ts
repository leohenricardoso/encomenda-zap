import { placeOrderController } from "@/infra/composition";

/**
 * POST /api/orders
 *
 * Public endpoint — no authentication required.
 * Creates a new order atomically: upserts customer → creates order → creates items.
 *
 * Request body:
 * {
 *   storeSlug:       string,              // from the catalog URL
 *   customer: {
 *     name:          string,
 *     whatsapp:      string               // any BR format: "(11) 99999-8888"
 *   },
 *   items: [{
 *     productId:     string,              // CatalogProduct.id
 *     variantId?:    string | null,       // CatalogVariant.id — required when product has variants
 *     quantity:      number
 *   }],
 *   shippingAddress?: string | null,      // null for pickup orders
 *   deliveryDate:    string               // ISO 8601 — must be a future date
 * }
 *
 * 201 Created  → { success: true, data: PlaceOrderOutput }
 * 400          → missing / malformed fields
 * 404          → store not found
 * 409          → conflict (e.g. duplicate)
 * 422          → business rule violation (inactive product, quantity < min, past date, etc.)
 * 500          → unexpected server error
 */
export const POST = placeOrderController.placeOrder;
