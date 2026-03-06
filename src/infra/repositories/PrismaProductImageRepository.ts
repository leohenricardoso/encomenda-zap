import { prisma } from "@/infra/prisma";
import type { IProductImageRepository } from "@/domain/productImage/IProductImageRepository";
import type {
  ProductImage,
  CreateProductImageInput,
} from "@/domain/productImage/ProductImage";
import type { ProductImage as PrismaImage } from "@prisma/client";

/**
 * PrismaProductImageRepository
 *
 * Implements IProductImageRepository using Prisma + PostgreSQL.
 *
 * Multi-tenancy: every write operation includes storeId in the WHERE clause
 * so cross-tenant mutations are structurally impossible.
 *
 * Position uniqueness is enforced by the DB constraint @@unique([productId, position]).
 */
export class PrismaProductImageRepository implements IProductImageRepository {
  // ─── Mapping ──────────────────────────────────────────────────────────────

  private toEntity(raw: PrismaImage): ProductImage {
    return {
      id: raw.id,
      productId: raw.productId,
      storeId: raw.storeId,
      imageUrl: raw.imageUrl,
      position: raw.position,
      createdAt: raw.createdAt,
    };
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findByProduct(
    productId: string,
    storeId: string,
  ): Promise<ProductImage[]> {
    const rows = await prisma.productImage.findMany({
      where: { productId, storeId },
      orderBy: { position: "asc" },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string, storeId: string): Promise<ProductImage | null> {
    const row = await prisma.productImage.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async countByProduct(productId: string): Promise<number> {
    return prisma.productImage.count({ where: { productId } });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async create(input: CreateProductImageInput): Promise<ProductImage> {
    const row = await prisma.productImage.create({
      data: {
        productId: input.productId,
        storeId: input.storeId,
        imageUrl: input.imageUrl,
        position: input.position,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    try {
      await prisma.productImage.delete({ where: { id, storeId } });
      return true;
    } catch {
      return false;
    }
  }

  async updatePosition(
    id: string,
    storeId: string,
    position: number,
  ): Promise<ProductImage | null> {
    try {
      const row = await prisma.productImage.update({
        where: { id, storeId },
        data: { position },
      });
      return this.toEntity(row);
    } catch {
      return null;
    }
  }
}
