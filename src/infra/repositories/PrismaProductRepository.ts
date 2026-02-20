import { prisma } from "@/infra/prisma";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/domain/product/Product";
import type { Product as PrismaProduct } from "@prisma/client";

/**
 * PrismaProductRepository
 *
 * Implements the domain's IProductRepository contract using Prisma + PostgreSQL.
 * This is the only file in the product slice allowed to import Prisma types.
 *
 * All methods enforce multi-tenancy by including storeId in every query.
 *
 * NestJS migration:
 * - Decorate with @Injectable() and @InjectPrismaClient() (or use PrismaService)
 * - Bind to IProductRepository token in the module providers array
 */
export class PrismaProductRepository implements IProductRepository {
  // ─── Mapping ────────────────────────────────────────────────────────────────

  /**
   * Prisma returns Decimal for `price` — convert to plain number
   * before exposing the domain entity.
   */
  private toEntity(raw: PrismaProduct): Product {
    return { ...raw, price: Number(raw.price) };
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  async findAllByStore(storeId: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string, storeId: string): Promise<Product | null> {
    const row = await prisma.product.findFirst({ where: { id, storeId } });
    return row ? this.toEntity(row) : null;
  }

  // ─── Write ──────────────────────────────────────────────────────────────────

  async create(input: CreateProductInput): Promise<Product> {
    const row = await prisma.product.create({
      data: {
        storeId: input.storeId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        isActive: input.isActive ?? true,
      },
    });
    return this.toEntity(row);
  }

  async update(
    id: string,
    storeId: string,
    input: UpdateProductInput,
  ): Promise<Product | null> {
    try {
      const row = await prisma.product.update({
        where: { id, storeId },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.price !== undefined && { price: input.price }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });
      return this.toEntity(row);
    } catch {
      // P2025 — record not found → return null (use case decides error shape)
      return null;
    }
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    try {
      await prisma.product.delete({ where: { id, storeId } });
      return true;
    } catch {
      return false;
    }
  }
}
