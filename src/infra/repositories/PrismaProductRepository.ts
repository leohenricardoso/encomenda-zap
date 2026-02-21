import { prisma } from "@/infra/prisma";
import type { IProductRepository } from "@/domain/product/IProductRepository";
import type {
  Product,
  ProductVariant,
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  PricingType,
} from "@/domain/product/Product";
import type {
  Product as PrismaProduct,
  ProductVariant as PrismaVariant,
} from "@prisma/client";

/**
 * PrismaProductRepository
 *
 * Implements IProductRepository using Prisma + PostgreSQL.
 * The ONLY file in the product slice allowed to import Prisma types.
 *
 * Multi-tenancy: every query includes storeId so cross-store access is
 * structurally impossible.
 *
 * All Product reads include their variants (via Prisma `include`) so
 * higher layers always receive a complete entity.
 */

const WITH_VARIANTS = {
  include: {
    variants: {
      orderBy: { sortOrder: "asc" as const },
    },
  },
} as const;

type PrismaProductWithVariants = PrismaProduct & { variants: PrismaVariant[] };

export class PrismaProductRepository implements IProductRepository {
  //  Mapping

  private toVariantEntity(raw: PrismaVariant): ProductVariant {
    return {
      id: raw.id,
      productId: raw.productId,
      storeId: raw.storeId,
      label: raw.label,
      price: Number(raw.price),
      pricingType: raw.pricingType as PricingType,
      isActive: raw.isActive,
      sortOrder: raw.sortOrder,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private toEntity(raw: PrismaProductWithVariants): Product {
    return {
      id: raw.id,
      storeId: raw.storeId,
      name: raw.name,
      description: raw.description,
      price: raw.price !== null ? Number(raw.price) : null,
      minQuantity: raw.minQuantity,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      variants: raw.variants.map((v) => this.toVariantEntity(v)),
    };
  }

  //  Product reads

  async findAllByStore(storeId: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      ...WITH_VARIANTS,
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string, storeId: string): Promise<Product | null> {
    const row = await prisma.product.findFirst({
      where: { id, storeId },
      ...WITH_VARIANTS,
    });
    return row ? this.toEntity(row) : null;
  }

  //  Product writes

  async create(input: CreateProductInput): Promise<Product> {
    const row = await prisma.product.create({
      data: {
        storeId: input.storeId,
        name: input.name,
        description: input.description ?? null,
        price: input.price ?? null,
        minQuantity: input.minQuantity ?? 1,
        isActive: input.isActive ?? true,
        variants: input.variants?.length
          ? {
              create: input.variants.map((v, i) => ({
                storeId: input.storeId,
                label: v.label,
                price: v.price,
                pricingType: v.pricingType,
                isActive: v.isActive ?? true,
                sortOrder: v.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      ...WITH_VARIANTS,
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
          ...(input.minQuantity !== undefined && {
            minQuantity: input.minQuantity,
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        ...WITH_VARIANTS,
      });
      return this.toEntity(row);
    } catch {
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

  //  Variant writes

  async createVariant(
    productId: string,
    storeId: string,
    input: CreateVariantInput,
  ): Promise<ProductVariant> {
    const row = await prisma.productVariant.create({
      data: {
        productId,
        storeId,
        label: input.label,
        price: input.price,
        pricingType: input.pricingType,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return this.toVariantEntity(row);
  }

  async updateVariant(
    variantId: string,
    storeId: string,
    input: UpdateVariantInput,
  ): Promise<ProductVariant | null> {
    try {
      const row = await prisma.productVariant.update({
        where: { id: variantId, storeId },
        data: {
          ...(input.label !== undefined && { label: input.label }),
          ...(input.price !== undefined && { price: input.price }),
          ...(input.pricingType !== undefined && {
            pricingType: input.pricingType,
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        },
      });
      return this.toVariantEntity(row);
    } catch {
      return null;
    }
  }

  async deleteVariant(variantId: string, storeId: string): Promise<boolean> {
    try {
      await prisma.productVariant.delete({ where: { id: variantId, storeId } });
      return true;
    } catch {
      return false;
    }
  }

  async replaceVariants(
    productId: string,
    storeId: string,
    variants: CreateVariantInput[],
  ): Promise<Product | null> {
    // Verify the product exists and belongs to this store
    const exists = await prisma.product.findFirst({
      where: { id: productId, storeId },
      select: { id: true },
    });
    if (!exists) return null;

    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId, storeId } }),
      ...variants.map((v, i) =>
        prisma.productVariant.create({
          data: {
            productId,
            storeId,
            label: v.label,
            price: v.price,
            pricingType: v.pricingType,
            isActive: v.isActive ?? true,
            sortOrder: v.sortOrder ?? i,
          },
        }),
      ),
    ]);

    const row = await prisma.product.findFirst({
      where: { id: productId, storeId },
      ...WITH_VARIANTS,
    });
    return row ? this.toEntity(row) : null;
  }
}
