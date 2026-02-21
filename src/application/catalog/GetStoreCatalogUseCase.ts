import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { ICatalogRepository } from "@/domain/catalog/ICatalogRepository";
import type { StoreCatalog } from "@/domain/catalog/types";

/**
 * GetStoreCatalogUseCase
 *
 * Fetches the public catalog for a store identified by its URL slug.
 * Only active stores and active products are returned.
 *
 * This use case is consumed by Server Components — no HTTP layer involved.
 * It is intentionally read-only and requires no authentication.
 *
 * Future extension points:
 *  - Accept optional `search` / `category` filter params
 *  - Add pagination when product count grows
 */
export class GetStoreCatalogUseCase {
  constructor(private readonly catalogRepo: ICatalogRepository) {}

  async execute(slug: string): Promise<StoreCatalog> {
    if (!slug?.trim()) {
      throw new AppError("Store slug is required.", HttpStatus.BAD_REQUEST);
    }

    const catalog = await this.catalogRepo.findBySlug(
      slug.trim().toLowerCase(),
    );

    if (!catalog) {
      throw new AppError("Catálogo não encontrado.", HttpStatus.NOT_FOUND);
    }

    return catalog;
  }
}
