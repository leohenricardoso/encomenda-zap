import { prisma } from "@/lib/prisma";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/domain/product/types";
import type { Product as PrismaProduct } from "@prisma/client";

// Helper: Prisma returns Decimal for price — convert to plain number for domain
function toProduct(raw: PrismaProduct): Product {
  return {
    ...raw,
    price: Number(raw.price),
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function findProductsByStore(storeId: string): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProduct);
}

/**
 * Finds a single product — enforces storeId so a user can never
 * read another store's product even if they know the ID.
 */
export async function findProductById(
  id: string,
  storeId: string,
): Promise<Product | null> {
  const row = await prisma.product.findFirst({
    where: { id, storeId },
  });
  return row ? toProduct(row) : null;
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  const row = await prisma.product.create({
    data: {
      storeId: input.storeId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      isActive: input.isActive ?? true,
    },
  });
  return toProduct(row);
}

/**
 * Updates a product — the WHERE clause includes storeId as an ownership guard.
 * Returns null when no row is updated (not found or wrong store).
 */
export async function updateProduct(
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
    return toProduct(row);
  } catch {
    // P2025 — record not found
    return null;
  }
}

/**
 * Deletes a product — storeId guard prevents cross-store deletion.
 * Returns false when no row is deleted.
 */
export async function deleteProduct(
  id: string,
  storeId: string,
): Promise<boolean> {
  try {
    await prisma.product.delete({ where: { id, storeId } });
    return true;
  } catch {
    return false;
  }
}
