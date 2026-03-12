import { prisma } from "@/infra/prisma";
import type { IProductCategoryRepository } from "@/domain/category/IProductCategoryRepository";
import type { CategorySummary } from "@/domain/category/Category";

export class PrismaProductCategoryRepository implements IProductCategoryRepository {
  async assign(
    productId: string,
    categoryId: string,
    storeId: string,
  ): Promise<void> {
    const nextPos = await this.nextPositionInCategory(categoryId, storeId);
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId, categoryId } },
      create: { productId, categoryId, storeId, position: nextPos },
      update: {},
    });
  }

  async remove(
    productId: string,
    categoryId: string,
    storeId: string,
  ): Promise<void> {
    await prisma.productCategory.deleteMany({
      where: { productId, categoryId, storeId },
    });
  }

  async replaceForProduct(
    productId: string,
    storeId: string,
    categoryIds: string[],
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { productId, storeId } });
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId, i) => ({
            productId,
            categoryId,
            storeId,
            position: i,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  async findCategoryIdsByProduct(
    productId: string,
    storeId: string,
  ): Promise<string[]> {
    const rows = await prisma.productCategory.findMany({
      where: { productId, storeId },
      select: { categoryId: true },
    });
    return rows.map((r) => r.categoryId);
  }

  async findCategoriesByProduct(
    productId: string,
    storeId: string,
  ): Promise<Pick<CategorySummary, "id" | "name" | "slug">[]> {
    const rows = await prisma.productCategory.findMany({
      where: { productId, storeId },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { position: "asc" },
    });
    return rows.map((r) => r.category);
  }

  async reorderProducts(
    categoryId: string,
    storeId: string,
    orderedProductIds: string[],
  ): Promise<void> {
    await prisma.$transaction(
      orderedProductIds.map((productId, i) =>
        prisma.productCategory.updateMany({
          where: { productId, categoryId, storeId },
          data: { position: i },
        }),
      ),
    );
  }

  async nextPositionInCategory(
    categoryId: string,
    storeId: string,
  ): Promise<number> {
    const result = await prisma.productCategory.aggregate({
      _max: { position: true },
      where: { categoryId, storeId },
    });
    return (result._max.position ?? -1) + 1;
  }

  async findProductsByCategory(
    categoryId: string,
    storeId: string,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      position: number;
      isActive: boolean;
    }>
  > {
    const rows = await prisma.productCategory.findMany({
      where: { categoryId, storeId },
      orderBy: { position: "asc" },
      include: { product: { select: { name: true, isActive: true } } },
    });
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.product.name,
      position: r.position,
      isActive: r.product.isActive,
    }));
  }
}
