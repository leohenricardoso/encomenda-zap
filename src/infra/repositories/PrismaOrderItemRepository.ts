import { prisma } from "@/infra/prisma";
import type { IOrderItemRepository } from "@/domain/order/IOrderItemRepository";
import {
  type OrderItem,
  type CreateOrderItemInput,
} from "@/domain/order/OrderItem";

/**
 * PrismaOrderItemRepository — concrete implementation of IOrderItemRepository.
 *
 * Mapping notes:
 * ─ Decimal fields (unitPrice, discountAmount) are cast with Number() because
 *   Prisma returns Prisma.Decimal objects, not native JS numbers.
 * ─ Items are effectively immutable: createMany / replaceAll are the only
 *   write paths.  replaceAll is wrapped in a Prisma interactive transaction
 *   to guarantee atomicity — no partial state can reach the DB.
 * ─ delete() is provided for admin-level single-item removal; the typical
 *   flow for editing an order is replaceAll().
 */
export class PrismaOrderItemRepository implements IOrderItemRepository {
  // ─── Mapping ────────────────────────────────────────────────────────────────

  private toEntity(raw: {
    id: string;
    orderId: string;
    productId: string;
    variantId: string | null;
    productName: string;
    variantLabel: string | null;
    quantity: number;
    unitPrice: { toNumber(): number };
    discountAmount: { toNumber(): number };
    createdAt: Date;
  }): OrderItem {
    return {
      id: raw.id,
      orderId: raw.orderId,
      productId: raw.productId,
      variantId: raw.variantId,
      productName: raw.productName,
      variantLabel: raw.variantLabel,
      quantity: raw.quantity,
      unitPrice: Number(raw.unitPrice),
      discountAmount: Number(raw.discountAmount),
      createdAt: raw.createdAt,
    };
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async findAllByOrder(orderId: string): Promise<OrderItem[]> {
    const rows = await prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => this.toEntity(r));
  }

  // ─── Commands ────────────────────────────────────────────────────────────────

  async createMany(items: CreateOrderItemInput[]): Promise<OrderItem[]> {
    // createManyAndReturn is available in Prisma v5.14+ / v7+.
    // Falls back to a transaction + findMany if not supported in older clients.
    const rows = await prisma.orderItem.createManyAndReturn({
      data: items.map((item) => ({
        orderId: item.orderId,
        productId: item.productId,
        variantId: item.variantId ?? null,
        productName: item.productName,
        variantLabel: item.variantLabel ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount ?? 0,
      })),
    });
    return rows.map((r) => this.toEntity(r));
  }

  async replaceAll(
    orderId: string,
    items: CreateOrderItemInput[],
  ): Promise<OrderItem[]> {
    /*
     * Interactive transaction:
     *   1. Delete all existing items for the order.
     *   2. Insert the new item set.
     * Both steps succeed or both are rolled back — no half-empty state.
     */
    const rows = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });

      return tx.orderItem.createManyAndReturn({
        data: items.map((item) => ({
          orderId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          productName: item.productName,
          variantLabel: item.variantLabel ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount ?? 0,
        })),
      });
    });

    return rows.map((r) => this.toEntity(r));
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.orderItem.delete({ where: { id } });
      return true;
    } catch {
      // Prisma P2025 — record not found
      return false;
    }
  }
}
