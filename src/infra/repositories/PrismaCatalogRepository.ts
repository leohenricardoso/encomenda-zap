import { prisma } from "@/infra/prisma";
import type { ICatalogRepository } from "@/domain/catalog/ICatalogRepository";
import type {
  StoreCatalog,
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
  async findBySlug(slug: string): Promise<StoreCatalog | null> {
    const store = await prisma.store.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsapp: true,
        pickupLocationName: true,
        pickupStreet: true,
        pickupNumber: true,
        pickupNeighborhood: true,
        pickupCity: true,
        pickupComplement: true,
        pickupReference: true,
        products: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            minQuantity: true,
            variants: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                label: true,
                price: true,
                pricingType: true,
                isActive: true,
                sortOrder: true,
              },
            },
            images: {
              orderBy: { position: "asc" },
              select: { id: true, imageUrl: true, position: true },
            },
          },
        },
      },
    });

    if (!store || !store.slug) return null;

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
      products: store.products.map((p) => this.toProduct(p)),
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
        "id" | "label" | "price" | "pricingType" | "isActive" | "sortOrder"
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
      "id" | "label" | "price" | "pricingType" | "isActive" | "sortOrder"
    >,
  ): CatalogVariant {
    return {
      id: raw.id,
      label: raw.label,
      price: Number(raw.price),
      pricingType: raw.pricingType as PricingType,
      isActive: raw.isActive,
      sortOrder: raw.sortOrder,
    };
  }
}
