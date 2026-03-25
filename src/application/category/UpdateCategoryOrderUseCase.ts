import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { ICategoryRepository } from "@/domain/category/ICategoryRepository";

// ─── Input ────────────────────────────────────────────────────────────────────

export interface ReorderItem {
  id: string;
  position: number;
}

// ─── Use Case ─────────────────────────────────────────────────────────────────

/**
 * UpdateCategoryOrderUseCase
 *
 * Persists a new display order for a store's categories.
 * Receives a full re-ordered list of { id, position } pairs and writes
 * them in a single transaction — no partial updates.
 *
 * Multi-tenancy: `storeId` is forwarded to the repository, ensuring every
 * UPDATE is scoped to the authenticated store's categories only.
 */
export class UpdateCategoryOrderUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(storeId: string, items: ReorderItem[]): Promise<void> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(
        "A lista de categorias não pode ser vazia.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.id?.trim()) {
        throw new AppError(
          "Cada item deve ter um id válido.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!Number.isInteger(item.position) || item.position < 0) {
        throw new AppError(
          "Cada item deve ter uma posição inteira não negativa.",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    await this.categoryRepo.reorderCategories(storeId, items);
  }
}
