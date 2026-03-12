import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";
import type { ICategoryRepository } from "@/domain/category/ICategoryRepository";

/**
 * DeleteCategoryUseCase
 *
 * Hard-deletes a category.
 * Throws if the category still has products assigned to prevent orphaning.
 */
export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string, storeId: string): Promise<void> {
    const count = await this.categoryRepo.countProducts(id, storeId);
    if (count > 0) {
      throw new AppError(
        `Esta categoria possui ${count} produto${count === 1 ? "" : "s"} vinculado${count === 1 ? "" : "s"}. Remova os produtos antes de excluir.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.categoryRepo.delete(id, storeId);
  }
}
