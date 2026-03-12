import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { slugify } from "@/shared/utils/slugify";
import type { ICategoryRepository } from "@/domain/category/ICategoryRepository";
import type { Category, UpdateCategoryInput } from "@/domain/category/Category";

/**
 * UpdateCategoryUseCase
 *
 * Allows partial updates to name, slug, and isActive.
 * Regenerates the slug when name changes (unless slug is explicitly provided).
 * Validates slug uniqueness within the store.
 */
export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(
    id: string,
    storeId: string,
    input: UpdateCategoryInput,
  ): Promise<Category> {
    if (!id?.trim()) {
      throw new AppError("id is required.", HttpStatus.BAD_REQUEST);
    }

    const patch: UpdateCategoryInput = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new AppError(
          "Category name cannot be empty.",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (input.name.trim().length > 100) {
        throw new AppError(
          "Category name must be at most 100 characters.",
          HttpStatus.BAD_REQUEST,
        );
      }
      patch.name = input.name.trim();
    }

    // Determine the new slug
    let newSlug: string | undefined;
    if (input.slug !== undefined) {
      newSlug = slugify(input.slug.trim());
    } else if (patch.name !== undefined) {
      newSlug = slugify(patch.name);
    }

    if (newSlug !== undefined) {
      if (!newSlug) {
        throw new AppError(
          "Could not derive a valid slug.",
          HttpStatus.BAD_REQUEST,
        );
      }
      const existing = await this.categoryRepo.findBySlug(newSlug, storeId);
      if (existing && existing.id !== id) {
        throw new AppError(
          "A category with this slug already exists.",
          HttpStatus.CONFLICT,
        );
      }
      patch.slug = newSlug;
    }

    if (input.isActive !== undefined) {
      patch.isActive = input.isActive;
    }

    const updated = await this.categoryRepo.update(id, storeId, patch);
    if (!updated) {
      throw new AppError("Category not found.", HttpStatus.NOT_FOUND);
    }
    return updated;
  }
}
