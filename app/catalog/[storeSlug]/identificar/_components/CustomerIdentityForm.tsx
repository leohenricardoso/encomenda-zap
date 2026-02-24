"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../_components/Button";
import { Input } from "../../../../_components/Input";

// ─── Session key ──────────────────────────────────────────────────────────────
// Stored in sessionStorage so the data is scoped to the browser tab and
// cleared automatically when the user closes the tab.
// The order-review page will read this key before showing the summary.

export const CUSTOMER_SESSION_KEY = "encomenda_zap:customer";

export interface CustomerSession {
  name: string;
  whatsapp: string; // normalised digits-only
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a raw digit string as (XX) XXXXX-XXXX / (XX) XXXX-XXXX
 * for a pleasant reading experience while the user types.
 */
function formatWhatsApp(digits: string): string {
  const d = digits.slice(0, 11); // max 11 digits without country code
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Normalises to digits-only, adds country code 55 when absent.
 * Returns null when the number doesn't look like a valid BR phone.
 */
function normaliseWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const withCC = digits.length <= 11 ? `55${digits}` : digits;
  if (withCC.length < 12 || withCC.length > 13) return null;
  return withCC;
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  whatsapp?: string;
}

function validate(name: string, whatsapp: string): FormErrors {
  const errors: FormErrors = {};

  if (!name.trim()) {
    errors.name = "Informe seu nome.";
  } else if (name.trim().length < 2) {
    errors.name = "Nome deve ter pelo menos 2 caracteres.";
  }

  if (!whatsapp) {
    errors.whatsapp = "Informe seu WhatsApp.";
  } else if (!normaliseWhatsApp(whatsapp)) {
    errors.whatsapp = "Número inválido. Use o formato (DDD) 9XXXX-XXXX.";
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  storeSlug: string;
  /** Store name shown in the submit button tooltip / aria label */
  storeName: string;
}

export function CustomerIdentityForm({ storeSlug, storeName }: Props) {
  const router = useRouter();

  // Field values
  const [name, setName] = useState("");
  // Displayed formatted (e.g. "(11) 99999-8888"), but stored/validated as raw
  const [whatsappDisplay, setWhatsappDisplay] = useState("");
  const whatsappRawRef = useRef(""); // digits only — source of truth for validation

  // Field-level errors (only shown after first submit attempt)
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Global submit status
  const [loading, setLoading] = useState(false);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (submitted) {
      setErrors((prev) => ({
        ...prev,
        name: e.target.value.trim().length >= 2 ? undefined : prev.name,
      }));
    }
  }

  function handleWhatsAppChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    whatsappRawRef.current = digits;
    setWhatsappDisplay(formatWhatsApp(digits));
    if (submitted) {
      setErrors((prev) => ({
        ...prev,
        whatsapp: normaliseWhatsApp(digits) ? undefined : prev.whatsapp,
      }));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const fieldErrors = validate(name, whatsappRawRef.current);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);

    // Persist identification to sessionStorage so downstream pages can read it
    const session: CustomerSession = {
      name: name.trim(),
      whatsapp: normaliseWhatsApp(whatsappRawRef.current)!,
    };

    try {
      sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
    } catch {
      // sessionStorage may be unavailable (private browsing on some browsers)
      // Continue anyway — the order-review page can prompt again if needed
    }

    // Navigate to the date-selection step
    router.push(`/catalog/${storeSlug}/pedido/data`);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* ── Name ── */}
      <Input
        label="Seu nome"
        id="customer-name"
        type="text"
        autoComplete="given-name"
        autoFocus
        required
        placeholder="Ex.: João Silva"
        value={name}
        onChange={handleNameChange}
        error={submitted ? errors.name : undefined}
      />

      {/* ── WhatsApp ── */}
      <div className="flex flex-col gap-1.5">
        <Input
          label="WhatsApp"
          id="customer-whatsapp"
          type="tel"
          autoComplete="tel"
          required
          placeholder="(11) 99999-8888"
          value={whatsappDisplay}
          onChange={handleWhatsAppChange}
          error={submitted ? errors.whatsapp : undefined}
          /*
           * inputMode="numeric" brings up the numeric keyboard on mobile
           * while keeping type="tel" for better autocomplete on iOS.
           */
          inputMode="numeric"
        />
        <p className="text-xs text-foreground-muted">
          Seu pedido será enviado para este número.
        </p>
      </div>

      {/* ── Privacy note ── */}
      <p className="text-xs text-foreground-muted leading-relaxed">
        Seus dados são usados apenas para envio do pedido a{" "}
        <span className="font-medium text-foreground">{storeName}</span> e não
        serão compartilhados.
      </p>

      {/* ── Submit ── */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        className="w-full"
        aria-label={`Continuar e montar pedido em ${storeName}`}
      >
        {loading ? "Aguarde…" : "Continuar"}
      </Button>
    </form>
  );
}
