import { prisma } from "@/infra/prisma";
import type { ICategoryRepository } from "@/domain/category/ICategoryRepository";
import type {
  Category,
  CategorySummary,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/domain/category/Category";
import type {
  Category as PrismaCategory,
  ProductCategory as PrismaProductCategory,
} from "@prisma/client";

type PrismaCategoryWithCount = PrismaCategory & {
  _count: { products: number };
};

export class PrismaCategoryRepository implements ICategoryRepository {
  private toEntity(raw: PrismaCategory): Category {
    return {
      id: raw.id,
      storeId: raw.storeId,
      name: raw.name,
      slug: raw.slug,
      position: raw.position,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private toSummary(raw: PrismaCategoryWithCount): CategorySummary {
    return {
      ...this.toEntity(raw),
      productCount: raw._count.products,
    };
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const raw = await prisma.category.create({
      data: {
        storeId: input.storeId,
        name: input.name,
        slug: input.slug!,
        position: input.position ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    return this.toEntity(raw);
  }

  async findById(id: string, storeId: string): Promise<Category | null> {
    const raw = await prisma.category.findFirst({ where: { id, storeId } });
    return raw ? this.toEntity(raw) : null;
  }

  async findBySlug(slug: string, storeId: string): Promise<Category | null> {
    const raw = await prisma.category.findFirst({ where: { slug, storeId } });
    return raw ? this.toEntity(raw) : null;
  }

  async findAllByStore(storeId: string): Promise<CategorySummary[]> {
    const rows = await prisma.category.findMany({
      where: { storeId },
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return rows.map((r) => this.toSummary(r as PrismaCategoryWithCount));
  }

  async update(
    id: string,
    storeId: string,
    input: UpdateCategoryInput,
  ): Promise<Category | null> {
    const exists = await prisma.category.findFirst({ where: { id, storeId } });
    if (!exists) return null;

    const raw = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    return this.toEntity(raw);
  }

  async delete(id: string, storeId: string): Promise<void> {
    await prisma.category.deleteMany({ where: { id, storeId } });
  }

  async countProducts(categoryId: string, storeId: string): Promise<number> {
    return prisma.productCategory.count({ where: { categoryId, storeId } });
  }

  async maxPosition(storeId: string): Promise<number> {
    const result = await prisma.category.aggregate({
      _max: { position: true },
      where: { storeId },
    });
    return result._max.position ?? 0;
  }

  async reorderCategories(
    storeId: string,
    items: { id: string; position: number }[],
  ): Promise<void> {
    await prisma.$transaction(
      items.map(({ id, position }) =>
        prisma.category.updateMany({
          where: { id, storeId },
          data: { position },
        }),
      ),
    );
  }
}
