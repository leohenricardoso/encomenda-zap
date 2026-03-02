"use client";

import { useState, useTransition } from "react";
import { saveWhatsapp } from "../actions";
import { Button } from "../../../../_components/Button";
import { InlineFeedback } from "../../../../_components/InlineFeedback";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip non-digit characters from input and limit to 15 digits (ITU E.164 max). */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 15);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WhatsappFormProps {
  /** Currently saved digit string, e.g. "5543999999999". Null = not yet configured. */
  initialWhatsapp: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsappForm({ initialWhatsapp }: WhatsappFormProps) {
  const [value, setValue] = useState(initialWhatsapp ?? "");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(digitsOnly(e.target.value));
    setFeedback(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await saveWhatsapp(value);
      if (result.success) {
        setFeedback({
          type: "success",
          message: "WhatsApp salvo com sucesso!",
        });
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
      {/* Section header */}
      <div className="space-y-0.5">
        <h2 className="font-semibold text-foreground">WhatsApp da loja</h2>
        <p className="text-sm text-foreground-muted">
          Número usado no botão de contato do catálogo público.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="store-whatsapp"
            className="text-sm font-medium text-foreground"
          >
            Número do WhatsApp
          </label>
          <input
            id="store-whatsapp"
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            placeholder="5543999999999"
            required
            disabled={isPending}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition disabled:opacity-50"
          />
          <p className="text-xs text-foreground-muted">
            Informe o WhatsApp com DDI. Ex:&nbsp;
            <span className="font-mono">5543999999999</span>
          </p>
        </div>

        {/* Feedback */}
        {feedback && (
          <InlineFeedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
