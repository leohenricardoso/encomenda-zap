/**
 * Customer domain model — pure TypeScript, no Prisma, no Next.js, no HTTP.
 *
 * Design rationale:
 * ─ A Customer is identified by their WhatsApp number within a store.
 *   The same phone number may exist in multiple stores (multi-tenant).
 * ─ WhatsApp is stored normalised (digits only, with country code) so
 *   lookups are unambiguous regardless of how the user typed it.
 * ─ storeId is always present so every query is tenant-scoped.
 *
 * Future: when Orders are introduced, an Order will reference customerId.
 * The domain is intentionally kept thin here — behaviour (e.g. order history,
 * loyalty points) is added alongside those features.
 */

// ─── Value objects ────────────────────────────────────────────────────────────

/**
 * normalizeWhatsApp — strips formatting and ensures the number carries the
 * Brazilian country code (55).
 *
 * Rules:
 *   - Remove everything that is not a digit.
 *   - If the result has 10–11 digits (no country code), prepend "55".
 *   - Valid range after normalisation: 12–13 digits (55 + DDD + number).
 *   - Throws a plain Error on invalid input so callers can wrap it in AppError.
 *
 * Examples:
 *   "+55 (11) 99999-8888" → "5511999998888"
 *   "11 99999 8888"       → "5511999998888"
 *   "5511999998888"       → "5511999998888"
 */
export function normalizeWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  const withCountry =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;

  // Brazil: 55 + 2-digit DDD + 8 or 9-digit number = 12 or 13 digits total
  if (withCountry.length < 12 || withCountry.length > 13) {
    throw new Error(
      "WhatsApp must be a valid Brazilian number (DDD + 8 or 9 digits).",
    );
  }

  return withCountry;
}

// ─── Customer entity ──────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  /**
   * Stored as a normalised digit string with country code.
   * Example: "5511999998888"
   * Never expose the raw id — use this as the public identifier in URLs if needed.
   */
  whatsapp: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  storeId: string;
  name: string;
  /** Accepts any common Brazilian format — normalised before persistence. */
  whatsapp: string;
}

export interface UpdateCustomerInput {
  name?: string;
  /** Accepts any common Brazilian format — normalised before persistence. */
  whatsapp?: string;
}

/** Safe public shape returned by all use cases and API routes. */
export type CustomerResponse = Customer;
