import { prisma } from "@/infra/prisma";
import type { ICatalogRepository } from "@/domain/catalog/ICatalogRepository";
import type {
  StoreCatalog,
  StoreCatalogCategory,
  CatalogProduct,
  CatalogImage,
  CatalogVariant,
} from "@/domain/catalog/types";
import type { PricingType } from "@/domain/product/Product";
import type {
  Product as PrismaProduct,
  ProductVariant as PrismaVariant,
  ProductImage as PrismaImage,
} from "@prisma/client";

/**
 * PrismaCatalogRepository
 *
 * Read-only catalog view. Builds the public StoreCatalog from a single
 * optimised Prisma query — no N+1, one round-trip to the database.
 *
 * Multi-tenancy is guaranteed implicitly: we look up the Store by slug,
 * then only load Products belonging to that Store via the relation.
 *
 * Active-only filtering happens at the database level (WHERE isActive = true)
 * for both Products and their Variants.
 */
export class PrismaCatalogRepository implements ICatalogRepository {
  async findBySlug(
    slug: string,
    categorySlug?: string,
  ): Promise<StoreCatalog | null> {
    // ── 1. Store info + categories (no products here) ─────────────────────
    const store = await prisma.store.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        defaultDeliveryFee: true,
        minimumAdvanceDays: true,
        pickupLocationName: true,
        pickupStreet: true,
        pickupNumber: true,
        pickupNeighborhood: true,
        pickupCity: true,
        pickupComplement: true,
        pickupReference: true,
        categories: {
          where: { isActive: true },
          orderBy: { position: "asc" },
          select: { id: true, name: true, slug: true, position: true },
        },
      },
    });

    if (!store || !store.slug) return null;

    // ── 2. Products ───────────────────────────────────────────────────────
    // When a category filter is active, query via ProductCategory to preserve
    // the saved sort order (position). Otherwise fetch all active products
    // for the store ordered by name.
    const productSelect = {
      id: true,
      name: true,
      description: true,
      price: true,
      minQuantity: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" as const },
        select: {
          id: true,
          label: true,
          price: true,
          pricingType: true,
          weightValue: true,
          weightUnit: true,
          isActive: true,
          sortOrder: true,
        },
      },
      images: {
        orderBy: { position: "asc" as const },
        select: { id: true, imageUrl: true, position: true },
      },
    } as const;

    let products: CatalogProduct[];

    if (categorySlug) {
      const targetCategory =
        store.categories.find((c) => c.slug === categorySlug) ?? null;

      if (!targetCategory) {
        products = [];
      } else {
        const pcRows = await prisma.productCategory.findMany({
          where: {
            categoryId: targetCategory.id,
            storeId: store.id,
            product: { isActive: true },
          },
          orderBy: { position: "asc" },
          select: { product: { select: productSelect } },
        });
        products = pcRows.map((row) => this.toProduct(row.product));
      }
    } else {
      const rawProducts = await prisma.product.findMany({
        where: { storeId: store.id, isActive: true },
        orderBy: { name: "asc" },
        select: productSelect,
      });
      products = rawProducts.map((p) => this.toProduct(p));
    }

    const pickupAddress =
      store.pickupLocationName &&
      store.pickupStreet &&
      store.pickupNumber &&
      store.pickupNeighborhood &&
      store.pickupCity
        ? {
            locationName: store.pickupLocationName,
            street: store.pickupStreet,
            number: store.pickupNumber,
            neighborhood: store.pickupNeighborhood,
            city: store.pickupCity,
            complement: store.pickupComplement,
            reference: store.pickupReference,
          }
        : null;

    return {
      storeId: store.id,
      name: store.name,
      slug: store.slug,
      whatsapp: store.whatsapp,
      pickupAddress,
      defaultDeliveryFee: Number(store.defaultDeliveryFee),
      minimumAdvanceDays: store.minimumAdvanceDays,
      categories: store.categories.map(
        (c): StoreCatalogCategory => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          position: c.position,
        }),
      ),
      products: products,
    };
  }

  // ─── Mapping helpers ──────────────────────────────────────────────────────

  private toProduct(
    raw: Pick<
      PrismaProduct,
      "id" | "name" | "description" | "price" | "minQuantity"
    > & {
      variants: Pick<
        PrismaVariant,
        | "id"
        | "label"
        | "price"
        | "pricingType"
        | "weightValue"
        | "weightUnit"
        | "isActive"
        | "sortOrder"
      >[];
      images: Pick<PrismaImage, "id" | "imageUrl" | "position">[];
    },
  ): CatalogProduct {
    const imageMapped: CatalogImage[] = raw.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      position: img.position,
    }));

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      price: raw.price !== null ? Number(raw.price) : null,
      minQuantity: raw.minQuantity,
      mainImageUrl: imageMapped[0]?.imageUrl ?? null,
      images: imageMapped,
      variants: raw.variants.map((v) => this.toVariant(v)),
    };
  }

  private toVariant(
    raw: Pick<
      PrismaVariant,
      | "id"
      | "label"
      | "price"
      | "pricingType"
      | "weightValue"
      | "weightUnit"
      | "isActive"
      | "sortOrder"
    >,
  ): CatalogVariant {
    return {
      id: raw.id,
      label: raw.label,
      price: Number(raw.price),
      pricingType: raw.pricingType as PricingType,
      weightValue: raw.weightValue !== null ? Number(raw.weightValue) : null,
      weightUnit: raw.weightUnit ?? null,
      isActive: raw.isActive,
      sortOrder: raw.sortOrder,
    };
  }
}
