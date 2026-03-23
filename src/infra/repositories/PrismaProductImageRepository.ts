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

  /**
   * Re-assigns contiguous positions (1, 2, 3…) to remaining images.
   *
   * The @@unique([productId, position]) constraint makes a naive sequential
   * update fail when two images would transiently share a position.  We avoid
   * this with a two-pass transaction:
   *   Pass 1 — move each image to a safe temp slot (100 + current position)
   *            so the 1-3 range is fully vacated.
   *   Pass 2 — assign the final sequential positions (1, 2, 3…).
   */
  async repackPositions(productId: string, storeId: string): Promise<void> {
    const images = await prisma.productImage.findMany({
      where: { productId, storeId },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    if (images.length === 0) return;

    await prisma.$transaction(async (tx) => {
      // Pass 1: move to temp positions to vacate the 1-3 range
      for (let i = 0; i < images.length; i++) {
        await tx.productImage.update({
          where: { id: images[i].id },
          data: { position: 100 + i + 1 },
        });
      }

      // Pass 2: assign final sequential positions
      for (let i = 0; i < images.length; i++) {
        await tx.productImage.update({
          where: { id: images[i].id },
          data: { position: i + 1 },
        });
      }
    });
  }

  async deleteAllByProduct(productId: string, storeId: string): Promise<void> {
    await prisma.productImage.deleteMany({ where: { productId, storeId } });
  }

  async replaceImages(
    productId: string,
    storeId: string,
    images: Array<{ imageUrl: string; position: number }>,
  ): Promise<ProductImage[]> {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId, storeId } });
      if (images.length === 0) return [];
      return Promise.all(
        images.map(({ imageUrl, position }) =>
          tx.productImage.create({
            data: { productId, storeId, imageUrl, position },
          }),
        ),
      );
    });
    return rows
      .map((r) => this.toEntity(r))
      .sort((a, b) => a.position - b.position);
  }
}
