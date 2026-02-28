import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { normalizeWhatsApp } from "@/domain/customer/Customer";
import {
  validateItemQuantity,
  computeLineTotal,
  computeOrderTotal,
} from "@/domain/order/OrderItem";
import { OrderStatus, FulfillmentType } from "@/domain/order/Order";
import type { ICatalogRepository } from "@/domain/catalog/ICatalogRepository";
import type { ICustomerRepository } from "@/domain/customer/ICustomerRepository";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type { IOrderRepository } from "@/domain/order/IOrderRepository";
import type { IOrderItemRepository } from "@/domain/order/IOrderItemRepository";
import type { CreateOrderItemInput } from "@/domain/order/OrderItem";

// ─── I/O types ────────────────────────────────────────────────────────────────

export interface PlaceOrderItemInput {
  /** CatalogProduct.id — from the public catalogue page */
  productId: string;
  /** CatalogVariant.id — required when the product has variants */
  variantId?: string | null;
  quantity: number;
}

export interface PlaceOrderInput {
  storeSlug: string;
  customer: {
    name: string;
    whatsapp: string;
  };
  items: PlaceOrderItemInput[];
  /** How the order should be fulfilled. */
  fulfillmentType: FulfillmentType;
  // ─ PICKUP fields ───────────────────────────────────────────
  /** Chosen time slot label e.g. "09:00 – 12:00". PICKUP only. */
  pickupTime?: string | null;
  /** StorePickupSlot.id. PICKUP only. */
  pickupSlotId?: string | null;
  // ─ DELIVERY fields ───────────────────────────────────────
  /** 8-digit CEP (no hyphen). Required when fulfillmentType === DELIVERY. */
  deliveryCep?: string | null;
  deliveryStreet?: string | null;
  deliveryNumber?: string | null;
  deliveryNeighborhood?: string | null;
  deliveryCity?: string | null;
  /**
   * When the order should be ready / delivered.
   * Must be a future date (strictly after now).
   */
  deliveryDate: Date;
  /** Optional free-text note from the customer. Stored verbatim, at most 500 chars. */
  notes?: string | null;
}

// ─── Output — no internal IDs exposed ────────────────────────────────────────

export interface PlaceOrderItemOutput {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PlaceOrderOutput {
  /**
   * Opaque order reference shown to the customer (e.g. in a WhatsApp confirmation).
   * Intentionally named "reference" rather than "id" to signal it is not a
   * guessable sequence number.  It is the order UUID — safe to expose read-only.
   */
  reference: string;
  status: OrderStatus;
  storeName: string;
  customer: {
    name: string;
    /** Formatted for display: (XX) XXXXX-XXXX */
    whatsapp: string;
  };
  items: PlaceOrderItemOutput[];
  fulfillmentType: FulfillmentType;
  // PICKUP
  pickupTime: string | null;
  // DELIVERY
  deliveryCep: string | null;
  deliveryStreet: string | null;
  deliveryNumber: string | null;
  deliveryNeighborhood: string | null;
  deliveryCity: string | null;
  /** Legacy: populated from structured delivery fields. */
  shippingAddress: string | null;
  deliveryDate: Date;
  total: number;
  createdAt: Date;
  /** Optional customer note, forwarded verbatim. */
  notes: string | null;
  /** Per-store sequential number shown to the customer (e.g. #42). */
  orderNumber: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formats a normalised digit string back into (DDD) XXXXX-XXXX for display. */
function formatWhatsApp(digits: string): string {
  // Remove country code (55) before formatting
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11)
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10)
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return digits;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * PlaceOrderService — orchestrates the multi-step order creation flow.
 *
 * Responsibilities (all):
 *   1. Validate inputs (date, items non-empty, customer fields)
 *   2. Resolve store from slug — 404 if unknown
 *   3. Upsert customer — find or create by WhatsApp per store
 *   4. Validate each line item:
 *        ─ Product exists and is active in this store
 *        ─ Variant exists and is active (when provided)
 *        ─ Variant required for variant-priced products
 *        ─ quantity >= product.minQuantity
 *   5. Freeze prices from current catalogue
 *   6. Create Order (status = PENDING)
 *   7. Create OrderItems
 *   8. Return a public summary with no internal IDs
 *
 * Not responsible for:
 *   ─ Sending WhatsApp notifications (future — emit an event or call a notifier)
 *   ─ Payment processing (future)
 *   ─ Authentication — order creation is public
 */
export class PlaceOrderService {
  constructor(
    private readonly catalogRepo: ICatalogRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly productRepo: IProductRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly orderItemRepo: IOrderItemRepository,
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    // ── 1. Basic payload validation ──────────────────────────────────────────

    if (!input.storeSlug?.trim()) {
      throw new AppError("Store slug is required.", HttpStatus.BAD_REQUEST);
    }
    if (!input.customer?.name?.trim()) {
      throw new AppError("Customer name is required.", HttpStatus.BAD_REQUEST);
    }
    if (!input.customer?.whatsapp?.trim()) {
      throw new AppError(
        "Customer WhatsApp is required.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new AppError(
        "An order must have at least one item.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !(input.deliveryDate instanceof Date) ||
      isNaN(input.deliveryDate.getTime())
    ) {
      throw new AppError(
        "deliveryDate must be a valid date.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.deliveryDate <= new Date()) {
      throw new AppError(
        "deliveryDate must be a future date.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Fulfillment-type-specific validation
    if (input.fulfillmentType === FulfillmentType.DELIVERY) {
      if (!input.deliveryCep?.trim()) {
        throw new AppError(
          "deliveryCep is required for delivery orders.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!input.deliveryStreet?.trim()) {
        throw new AppError(
          "deliveryStreet is required for delivery orders.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!input.deliveryNumber?.trim()) {
        throw new AppError(
          "deliveryNumber is required for delivery orders.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!input.deliveryNeighborhood?.trim()) {
        throw new AppError(
          "deliveryNeighborhood is required for delivery orders.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!input.deliveryCity?.trim()) {
        throw new AppError(
          "deliveryCity is required for delivery orders.",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // ── 2. Resolve store ─────────────────────────────────────────────────────

    const catalog = await this.catalogRepo.findBySlug(
      input.storeSlug.trim().toLowerCase(),
    );
    if (!catalog) {
      throw new AppError("Store not found.", HttpStatus.NOT_FOUND);
    }
    const { storeId, name: storeName } = catalog;

    // ── 3. Upsert customer ───────────────────────────────────────────────────

    let normalisedWhatsApp: string;
    try {
      normalisedWhatsApp = normalizeWhatsApp(input.customer.whatsapp);
    } catch {
      throw new AppError(
        "Invalid WhatsApp number. Use format: (DDD) 9XXXX-XXXX.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const existingCustomer = await this.customerRepo.findByWhatsApp(
      normalisedWhatsApp,
      storeId,
    );

    const customer =
      existingCustomer ??
      (await this.customerRepo.create({
        storeId,
        name: input.customer.name.trim(),
        whatsapp: normalisedWhatsApp,
      }));

    // ── 4 + 5. Validate items and freeze prices ───────────────────────────────

    const resolvedItems: CreateOrderItemInput[] = [];

    for (const line of input.items) {
      if (!line.productId?.trim()) {
        throw new AppError(
          "Each item must include a productId.",
          HttpStatus.BAD_REQUEST,
        );
      }

      const product = await this.productRepo.findById(line.productId, storeId);

      if (!product) {
        throw new AppError(
          `Product not found or unavailable.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (!product.isActive) {
        throw new AppError(
          `"${product.name}" is currently unavailable.`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      // Validate quantity against minimum
      validateItemQuantity(line.quantity, product.minQuantity, product.name);

      const hasVariants = product.variants.filter((v) => v.isActive).length > 0;

      let frozenPrice: number;
      let variantId: string | null = null;
      let variantLabel: string | null = null;

      if (hasVariants) {
        // Variant-priced product — variantId is mandatory
        if (!line.variantId) {
          throw new AppError(
            `Please select a variant for "${product.name}".`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        const variant = product.variants.find(
          (v) => v.id === line.variantId && v.isActive,
        );
        if (!variant) {
          throw new AppError(
            `Selected variant for "${product.name}" is not available.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        frozenPrice = variant.price;
        variantId = variant.id;
        variantLabel = variant.label;
      } else {
        // Simple product — price must be defined on the product
        if (product.price === null || product.price === undefined) {
          throw new AppError(
            `"${product.name}" has no available price.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        frozenPrice = product.price;
      }

      resolvedItems.push({
        orderId: "", // filled in after order creation
        productId: product.id,
        variantId,
        productName: product.name,
        variantLabel,
        quantity: line.quantity,
        unitPrice: frozenPrice,
        discountAmount: 0,
      });
    }

    // ── 6. Create order ──────────────────────────────────────────────────────

    // Build legacy shippingAddress from structured delivery fields
    const shippingAddress =
      input.fulfillmentType === FulfillmentType.DELIVERY
        ? [
            `${input.deliveryStreet}, ${input.deliveryNumber}`,
            input.deliveryNeighborhood,
            input.deliveryCity,
            `CEP ${input.deliveryCep}`,
          ]
            .filter(Boolean)
            .join(" – ")
        : null;

    const order = await this.orderRepo.create({
      storeId,
      customerId: customer.id,
      deliveryDate: input.deliveryDate,
      fulfillmentType: input.fulfillmentType,
      pickupTime: input.pickupTime ?? null,
      pickupSlotId: input.pickupSlotId ?? null,
      deliveryCep: input.deliveryCep ?? null,
      deliveryStreet: input.deliveryStreet ?? null,
      deliveryNumber: input.deliveryNumber ?? null,
      deliveryNeighborhood: input.deliveryNeighborhood ?? null,
      deliveryCity: input.deliveryCity ?? null,
      shippingAddress,
      notes: input.notes ? input.notes.trim().slice(0, 500) : null,
    });

    // ── 7. Create items (backfill orderId now that we have it) ───────────────

    const itemsWithOrderId = resolvedItems.map((item) => ({
      ...item,
      orderId: order.id,
    }));

    const createdItems = await this.orderItemRepo.createMany(itemsWithOrderId);

    // ── 8. Build public summary ───────────────────────────────────────────────

    const outputItems: PlaceOrderItemOutput[] = createdItems.map((item) => ({
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: computeLineTotal(item),
    }));

    return {
      reference: order.id,
      status: order.status,
      storeName,
      customer: {
        name: customer.name,
        whatsapp: formatWhatsApp(normalisedWhatsApp),
      },
      items: outputItems,
      fulfillmentType: order.fulfillmentType,
      pickupTime: order.pickupTime,
      deliveryCep: order.deliveryCep,
      deliveryStreet: order.deliveryStreet,
      deliveryNumber: order.deliveryNumber,
      deliveryNeighborhood: order.deliveryNeighborhood,
      deliveryCity: order.deliveryCity,
      shippingAddress: order.shippingAddress,
      deliveryDate: order.deliveryDate,
      total: computeOrderTotal(createdItems),
      createdAt: order.createdAt,
      notes: order.notes,
      orderNumber: order.orderNumber,
    };
  }
}
