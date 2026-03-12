import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import { slugify } from "@/shared/utils/slugify";
import type { ICategoryRepository } from "@/domain/category/ICategoryRepository";
import type { Category } from "@/domain/category/Category";

/**
 * CreateCategoryUseCase
 *
 * Validates input, generates a slug, checks uniqueness per store, sets
 * position = maxPosition + 1, and persists the new category.
 */
export class CreateCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(
    storeId: string,
    name: string,
    isActive?: boolean,
  ): Promise<Category> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }
    if (!name?.trim()) {
      throw new AppError("Category name is required.", HttpStatus.BAD_REQUEST);
    }
    if (name.trim().length > 100) {
      throw new AppError(
        "Category name must be at most 100 characters.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const slug = slugify(name.trim());
    if (!slug) {
      throw new AppError(
        "Could not derive a valid slug from the given name.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.categoryRepo.findBySlug(slug, storeId);
    if (existing) {
      throw new AppError(
        "A category with this name already exists.",
        HttpStatus.CONFLICT,
      );
    }

    const maxPos = await this.categoryRepo.maxPosition(storeId);

    return this.categoryRepo.create({
      storeId,
      name: name.trim(),
      slug,
      position: maxPos + 1,
      isActive: isActive ?? true,
    });
  }
}
