/**
 * StoreCepRange domain model — pure TypeScript, no Prisma, no HTTP.
 *
 * Design rationale:
 * ─ Each store may define MULTIPLE CEP delivery ranges (1:N with Store).
 * ─ cepStart / cepEnd are stored as 8-digit numeric strings ("01310000").
 *   Lexicographic comparison works because they are zero-padded fixed-width.
 * ─ A CEP is valid if it falls within ANY configured range:
 *   cepStart <= cep <= cepEnd.
 * ─ When a store has NO ranges, delivery is unrestricted (all CEPs accepted).
 */

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface StoreCepRange {
  id: string;
  storeId: string;
  /** First CEP of the range, 8 digits, no hyphen — e.g. "01310000" */
  cepStart: string;
  /** Last CEP of the range, 8 digits, no hyphen — e.g. "01319999" */
  cepEnd: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Input / Output types ─────────────────────────────────────────────────────

export interface ValidateCepInput {
  /** Store slug — used to resolve storeId in the public use case. */
  storeSlug: string;
  /** CEP to validate — may contain a hyphen; normalised before comparison. */
  cep: string;
}

export interface ValidateCepResult {
  valid: boolean;
  /** True when no range is configured for the store — delivery is unrestricted. */
  unrestricted: boolean;
}
