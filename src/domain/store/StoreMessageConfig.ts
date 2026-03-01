/**
 * StoreMessageConfig — per-store WhatsApp message templates.
 *
 * Each template may include the following placeholders that are resolved
 * at send-time by the application layer:
 *   {cliente} — customer first name
 *   {pedido}  — per-store sequential order number (e.g. "42")
 *   {data}    — formatted delivery date (e.g. "sexta-feira, 6 de março")
 *
 * Both message fields are optional.  When null the application falls back
 * to DEFAULT_MESSAGES.  This keeps old stores working without DB updates.
 *
 * Extensibility note: additional channels (email, SMS) should extend this
 * model by adding new nullable fields, not by creating a new entity.
 */

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface StoreMessageConfig {
  storeId: string;
  /** Template for order approval. Null means "use default". */
  approvalMessage: string | null;
  /** Template for order rejection. Null means "use default". */
  rejectionMessage: string | null;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_MESSAGES = {
  approval:
    "Olá {cliente}, seu pedido nº {pedido} foi aprovado! Entrega prevista: {data}. 🎉",
  rejection:
    "Olá {cliente}, infelizmente seu pedido nº {pedido} não pôde ser aceito. Entre em contato para mais informações.",
  contact: "Olá {cliente}, estamos falando sobre seu pedido nº {pedido}.",
} as const;

// ─── Placeholder constants (used in UI documentation) ────────────────────────

export const MESSAGE_PLACEHOLDERS = [
  { key: "{cliente}", description: "Nome do cliente" },
  { key: "{pedido}", description: "Número do pedido (ex: 42)" },
  { key: "{data}", description: "Data de entrega formatada" },
] as const;

export const MESSAGE_MAX_LENGTH = 500;

// ─── Render helper ────────────────────────────────────────────────────────────

export interface MessageVars {
  cliente: string;
  pedido: string;
  data: string;
}

/**
 * renderMessage — resolves {client}, {pedido}, {data} placeholders in a
 * template string.
 *
 * Strips all HTML tags before rendering to prevent injection.
 * Unknown placeholders (e.g. {foo}) are left as-is.
 */
export function renderMessage(template: string, vars: MessageVars): string {
  // Strip HTML tags
  const safe = template.replace(/<[^>]*>/g, "");
  return safe
    .replace(/\{cliente\}/g, vars.cliente)
    .replace(/\{pedido\}/g, vars.pedido)
    .replace(/\{data\}/g, vars.data);
}

/**
 * resolveMessage — resolves either the custom template or the named default,
 * then substitutes placeholders.
 */
export function resolveMessage(
  template: string | null,
  fallback: string,
  vars: MessageVars,
): string {
  return renderMessage(template ?? fallback, vars);
}
