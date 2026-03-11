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
 * When no ranges are configured the result is { valid: true, unrestricted: true,
 * deliveryFee: store.defaultDeliveryFee }.
 * A CEP is valid if: cepStart ≤ cep ≤ cepEnd for at least one range.
 * Returns the deliveryFee from the matching range.
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
      return {
        valid: true,
        unrestricted: true,
        deliveryFee: catalog.defaultDeliveryFee,
      };
    }

    // Find the matching range (first match — ranges should not overlap)
    const matchedRange = ranges.find(
      (r) => digits >= r.cepStart && digits <= r.cepEnd,
    );

    if (!matchedRange) {
      return { valid: false, unrestricted: false, deliveryFee: 0 };
    }

    return {
      valid: true,
      unrestricted: false,
      deliveryFee: matchedRange.deliveryFee,
    };
  }
}
