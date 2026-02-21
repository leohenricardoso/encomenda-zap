/**
 * slugify — converts a human-readable string into a URL-safe identifier.
 *
 * Examples:
 *   "Doces da Maria"       → "doces-da-maria"
 *   "Café & Bistrô"        → "cafe-bistro"
 *   "  Padaria São José  " → "padaria-sao-jose"
 *
 * Max 63 characters (safe for DNS labels and most DB column limits).
 * Decomposes accented characters via NFD normalisation before stripping diacritics.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}
