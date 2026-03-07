import { prisma } from "@/infra/prisma";
import type { ICustomerRepository } from "@/domain/customer/ICustomerRepository";
import {
  type Customer,
  type CustomerWithStats,
  type CustomerFilters,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  normalizeWhatsApp,
} from "@/domain/customer/Customer";

/**
 * PrismaCustomerRepository — concrete implementation of ICustomerRepository.
 *
 * Mapping notes:
 * ─ All writes normalise whatsapp via normalizeWhatsApp() before persisting.
 * ─ update() / delete() return null / false (instead of throwing) when the
 *   record does not exist — callers treat null as a 404.
 * ─ Every query is scoped by storeId to enforce multi-tenancy.
 */
export class PrismaCustomerRepository implements ICustomerRepository {
  // ─── Mapping ────────────────────────────────────────────────────────────────

  private toEntity(raw: {
    id: string;
    storeId: string;
    name: string;
    whatsapp: string;
    createdAt: Date;
    updatedAt: Date;
  }): Customer {
    return {
      id: raw.id,
      storeId: raw.storeId,
      name: raw.name,
      whatsapp: raw.whatsapp,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async findAllByStore(storeId: string): Promise<Customer[]> {
    const rows = await prisma.customer.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findAllByStoreWithStats(
    storeId: string,
    filters?: CustomerFilters,
  ): Promise<CustomerWithStats[]> {
    // Build the optional name / whatsapp search clause
    const searchClause = filters?.search
      ? {
          OR: [
            {
              name: { contains: filters.search, mode: "insensitive" as const },
            },
            {
              whatsapp: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const rows = await prisma.customer.findMany({
      where: { storeId, ...searchClause },
      orderBy: { name: "asc" },
      include: {
        orders: {
          orderBy: { createdAt: "asc" },
          include: { items: true },
        },
      },
    });

    // Compute per-customer aggregates in-process.
    const withStats: CustomerWithStats[] = rows.map((r) => {
      const orders = r.orders;
      const ordersCount = orders.length;

      const totalSpent = orders.reduce((sum, o) => {
        const orderTotal = o.items.reduce(
          (s, item) =>
            s +
            (Number(item.unitPrice) - Number(item.discountAmount)) *
              item.quantity,
          0,
        );
        return sum + orderTotal;
      }, 0);

      const avgTicket = ordersCount > 0 ? totalSpent / ordersCount : 0;

      const firstOrderAt = ordersCount > 0 ? orders[0]!.createdAt : null;
      const lastOrderAt =
        ordersCount > 0 ? orders[ordersCount - 1]!.createdAt : null;

      return {
        ...this.toEntity(r),
        ordersCount,
        totalSpent,
        avgTicket,
        firstOrderAt,
        lastOrderAt,
      };
    });

    // Post-aggregation filters (cannot be done at DB level without raw SQL)
    return withStats.filter((c) => {
      if (filters?.minOrders !== undefined && c.ordersCount < filters.minOrders)
        return false;
      if (
        filters?.minTotalSpent !== undefined &&
        c.totalSpent < filters.minTotalSpent
      )
        return false;
      return true;
    });
  }

  async findById(id: string, storeId: string): Promise<Customer | null> {
    const row = await prisma.customer.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByWhatsApp(
    whatsapp: string,
    storeId: string,
  ): Promise<Customer | null> {
    const normalised = normalizeWhatsApp(whatsapp);
    const row = await prisma.customer.findUnique({
      where: { whatsapp_storeId: { whatsapp: normalised, storeId } },
    });
    return row ? this.toEntity(row) : null;
  }

  // ─── Commands ────────────────────────────────────────────────────────────────

  async create(input: CreateCustomerInput): Promise<Customer> {
    const normalised = normalizeWhatsApp(input.whatsapp);
    const row = await prisma.customer.create({
      data: {
        storeId: input.storeId,
        name: input.name.trim(),
        whatsapp: normalised,
      },
    });
    return this.toEntity(row);
  }

  async update(
    id: string,
    storeId: string,
    input: UpdateCustomerInput,
  ): Promise<Customer | null> {
    try {
      const data: { name?: string; whatsapp?: string } = {};

      if (input.name !== undefined) data.name = input.name.trim();
      if (input.whatsapp !== undefined)
        data.whatsapp = normalizeWhatsApp(input.whatsapp);

      const row = await prisma.customer.update({
        where: { id, storeId },
        data,
      });
      return this.toEntity(row);
    } catch {
      // Prisma throws P2025 when the record is not found; return null as a 404.
      return null;
    }
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    try {
      await prisma.customer.delete({ where: { id, storeId } });
      return true;
    } catch {
      return false;
    }
  }
}
