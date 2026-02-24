import { prisma } from "@/infra/prisma";
import type { IOrderRepository } from "@/domain/order/IOrderRepository";
import {
  type Order,
  type CreateOrderInput,
  type UpdateOrderInput,
  type OrderFilters,
  OrderStatus,
  canTransitionTo,
} from "@/domain/order/Order";
import type { OrderItem } from "@/domain/order/OrderItem";

/**
 * PrismaOrderRepository — concrete implementation of IOrderRepository.
 *
 * Mapping notes:
 * ─ Prisma's OrderStatus enum is cast to the domain OrderStatus enum in
 *   toEntity().  Both are string enums with identical values, so the cast
 *   is safe and avoids a runtime lookup table.
 * ─ updateStatus() enforces the state machine via canTransitionTo() before
 *   writing.  The domain throws a plain Error on an invalid transition so
 *   HTTP controllers can catch it and return 409 Conflict.
 * ─ update() / delete() return null / false (P2025 safety — record not found).
 * ─ All queries are scoped by storeId to enforce multi-tenancy.
 */
export class PrismaOrderRepository implements IOrderRepository {
  // ─── Mapping ────────────────────────────────────────────────────────────────

  private toEntity(raw: {
    id: string;
    storeId: string;
    customerId: string;
    deliveryDate: Date;
    shippingAddress: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    return {
      id: raw.id,
      storeId: raw.storeId,
      customerId: raw.customerId,
      deliveryDate: raw.deliveryDate,
      shippingAddress: raw.shippingAddress,
      status: raw.status as OrderStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private toItemEntity(raw: {
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

  async findAllByStore(
    storeId: string,
    filters?: OrderFilters,
  ): Promise<Order[]> {
    // Build the optional status filter
    const statusFilter = filters?.status
      ? {
          status: Array.isArray(filters.status)
            ? { in: filters.status }
            : filters.status,
        }
      : {};

    const rows = await prisma.order.findMany({
      where: {
        storeId,
        ...statusFilter,
        ...(filters?.customerId && { customerId: filters.customerId }),
        ...(filters?.deliveryDateFrom || filters?.deliveryDateTo
          ? {
              deliveryDate: {
                ...(filters.deliveryDateFrom && {
                  gte: filters.deliveryDateFrom,
                }),
                ...(filters.deliveryDateTo && { lte: filters.deliveryDateTo }),
              },
            }
          : {}),
      },
      orderBy: { deliveryDate: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string, storeId: string): Promise<Order | null> {
    const row = await prisma.order.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdWithItems(
    id: string,
    storeId: string,
  ): Promise<(Order & { items: OrderItem[] }) | null> {
    const row = await prisma.order.findFirst({
      where: { id, storeId },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
    if (!row) return null;
    return {
      ...this.toEntity(row),
      items: row.items.map((item) => this.toItemEntity(item)),
    };
  }

  async findAllByCustomer(
    customerId: string,
    storeId: string,
  ): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { customerId, storeId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toEntity(r));
  }

  // ─── Commands ────────────────────────────────────────────────────────────────

  async create(input: CreateOrderInput): Promise<Order> {
    const row = await prisma.order.create({
      data: {
        storeId: input.storeId,
        customerId: input.customerId,
        deliveryDate: input.deliveryDate,
        shippingAddress: input.shippingAddress ?? null,
        // status defaults to PENDING via the Prisma model default
      },
    });
    return this.toEntity(row);
  }

  async update(
    id: string,
    storeId: string,
    input: UpdateOrderInput,
  ): Promise<Order | null> {
    try {
      const data: { deliveryDate?: Date; shippingAddress?: string | null } = {};

      if (input.deliveryDate !== undefined)
        data.deliveryDate = input.deliveryDate;
      if (input.shippingAddress !== undefined)
        data.shippingAddress = input.shippingAddress;

      const row = await prisma.order.update({
        where: { id, storeId },
        data,
      });
      return this.toEntity(row);
    } catch {
      // Prisma P2025 — record not found
      return null;
    }
  }

  async updateStatus(
    id: string,
    storeId: string,
    newStatus: OrderStatus,
  ): Promise<Order | null> {
    // 1. Load current order (tenant-scoped)
    const current = await prisma.order.findFirst({
      where: { id, storeId },
      select: { status: true },
    });

    if (!current) return null;

    // 2. Validate transition against the domain state machine
    const currentStatus = current.status as OrderStatus;
    if (!canTransitionTo(currentStatus, newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}.`,
      );
    }

    // 3. Persist
    const row = await prisma.order.update({
      where: { id, storeId },
      data: { status: newStatus },
    });
    return this.toEntity(row);
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    try {
      await prisma.order.delete({ where: { id, storeId } });
      return true;
    } catch {
      return false;
    }
  }
}
