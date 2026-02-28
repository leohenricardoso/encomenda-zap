// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format normalised WhatsApp digits to a readable BR number.
 * "5511999998888" → "(11) 99999-8888"
 * "551199998888"  → "(11) 9999-8888"
 */
export function formatWhatsApp(digits: string): string {
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = local.slice(0, 2);
  const num = local.slice(2);
  return num.length === 9
    ? `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
    : `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
}

/** "sexta-feira, 6 de março de 2026" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** "XXXXX-XXX" */
export function formatCep(raw: string): string {
  return raw.length === 8 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
}

/**
 * Build a wa.me URL with a pre-filled message that includes the order number.
 * Sanitises the phone to digits-only and encodeURIComponent-encodes the text.
 *
 * @param phone        Raw WhatsApp number (any format — digits extracted automatically)
 * @param name         Customer name used in the greeting (first name extracted)
 * @param orderNumber  Optional per-store sequential number to include in the message
 */
export function whatsAppUrl(
  phone: string,
  name: string,
  orderNumber?: number | null,
): string {
  const digits = phone.replace(/\D/g, "");
  const firstName = name.trim().split(/\s+/)[0] ?? name.trim();
  const text =
    orderNumber != null
      ? `Olá ${firstName}, estamos falando sobre seu pedido nº ${orderNumber}.`
      : `Olá ${firstName}, estamos falando sobre seu pedido.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
