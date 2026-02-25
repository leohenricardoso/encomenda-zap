import type { ICatalogRepository } from "@/domain/catalog/ICatalogRepository";
import type { IStoreCepRangeRepository } from "@/domain/cepRange/IStoreCepRangeRepository";
import type { ValidateCepResult } from "@/domain/cepRange/StoreCepRange";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/**
 * ValidateCepUseCase
 *
 * Public use case — no authentication required.
 * Resolves storeSlug → storeId via the catalog repository, then checks
 * whether the provided CEP falls within ANY of the store’s configured ranges.
 *
 * When no ranges are configured the result is { valid: true, unrestricted: true }.
 * A CEP is valid if: cepStart ≤ cep ≤ cepEnd for at least one range.
 */
export class ValidateCepUseCase {
  constructor(
    private readonly catalogRepo: ICatalogRepository,
    private readonly cepRangeRepo: IStoreCepRangeRepository,
  ) {}

  async execute(storeSlug: string, rawCep: string): Promise<ValidateCepResult> {
    if (!storeSlug?.trim()) {
      throw new AppError("Store slug is required.", HttpStatus.BAD_REQUEST);
    }

    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) {
      throw new AppError(
        "CEP inválido. Informe 8 dígitos.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Resolve slug → storeId
    const catalog = await this.catalogRepo.findBySlug(
      storeSlug.trim().toLowerCase(),
    );
    if (!catalog) {
      throw new AppError("Loja não encontrada.", HttpStatus.NOT_FOUND);
    }

    const ranges = await this.cepRangeRepo.findByStore(catalog.storeId);

    // No ranges configured → unrestricted delivery
    if (ranges.length === 0) {
      return { valid: true, unrestricted: true };
    }

    // CEP is valid if it falls within ANY range
    const valid = ranges.some(
      (r) => digits >= r.cepStart && digits <= r.cepEnd,
    );

    return { valid, unrestricted: false };
  }
}
