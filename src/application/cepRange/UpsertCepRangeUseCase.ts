import type { IStoreCepRangeRepository } from "@/domain/cepRange/IStoreCepRangeRepository";
import type { StoreCepRange } from "@/domain/cepRange/StoreCepRange";
import { AppError } from "@/shared/errors/AppError";
import { HttpStatus } from "@/shared/http/statuses";

/** Strips all non-digits and validates an 8-digit CEP string. */
function normaliseCep(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) {
    throw new AppError(
      "CEP inválido. Informe 8 dígitos (ex: 01310-000).",
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  return digits;
}

/**
 * AddCepRangeUseCase  (formerly UpsertCepRangeUseCase)
 *
 * Adds a new delivery CEP range to the store.
 * Validates that both CEPs contain exactly 8 digits and that
 * cepStart ≤ cepEnd (string comparison is valid for zero-padded numbers).
 *
 * Exported under the old name to minimise composition-root churn; import the
 * class as `AddCepRangeUseCase` at the call site.
 */
export class AddCepRangeUseCase {
  constructor(private readonly repo: IStoreCepRangeRepository) {}

  async execute(
    storeId: string,
    rawStart: string,
    rawEnd: string,
  ): Promise<StoreCepRange> {
    if (!storeId?.trim()) {
      throw new AppError("storeId is required.", HttpStatus.BAD_REQUEST);
    }

    const cepStart = normaliseCep(rawStart);
    const cepEnd = normaliseCep(rawEnd);

    if (cepStart > cepEnd) {
      throw new AppError(
        "CEP inicial deve ser menor ou igual ao CEP final.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.repo.create(storeId, cepStart, cepEnd);
  }
}

/** @deprecated Use AddCepRangeUseCase */
export { AddCepRangeUseCase as UpsertCepRangeUseCase };
