/**
 * formatWeight — formats a weight value and unit into a human-readable string.
 *
 * Returns null when either value or unit is absent (e.g. UNIT-priced variants).
 *
 * Examples:
 *   formatWeight(250, "g")  → "250g"
 *   formatWeight(500, "g")  → "500g"
 *   formatWeight(1, "kg")   → "1kg"
 *   formatWeight(2.5, "kg") → "2,5kg"
 *   formatWeight(null, "g") → null
 *   formatWeight(250, null) → null
 */
export function formatWeight(
  value: number | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (value == null || unit == null) return null;

  // Format the number using pt-BR locale — avoids trailing `.0` for whole numbers
  // and renders decimals with comma (e.g. 2,5kg).
  const formatted = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(value);

  return `${formatted}${unit}`;
}
