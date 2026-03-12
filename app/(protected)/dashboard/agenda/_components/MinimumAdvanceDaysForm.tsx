"use client";

import { useState, useTransition } from "react";
import { saveMinimumAdvanceDays } from "../actions";
import { Button } from "../../../../_components/Button";
import { InlineFeedback } from "../../../../_components/InlineFeedback";

// ─── Props ────────────────────────────────────────────────────────────────────

interface MinimumAdvanceDaysFormProps {
  initialDays: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MinimumAdvanceDaysForm({
  initialDays,
}: MinimumAdvanceDaysFormProps) {
  const [days, setDays] = useState(String(initialDays));
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const parsed = parseInt(days, 10);
    if (isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      setFeedback({
        type: "error",
        message: "Informe um número inteiro maior ou igual a zero.",
      });
      return;
    }

    startTransition(async () => {
      const result = await saveMinimumAdvanceDays(parsed);
      if (result.success) {
        setFeedback({ type: "success", message: "Prazo mínimo salvo!" });
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Erro ao salvar. Tente novamente.",
        });
      }
    });
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 flex flex-col gap-4">
      <div className="space-y-0.5">
        <h2 className="font-semibold text-foreground">
          Antecedência mínima para pedidos
        </h2>
        <p className="text-sm text-foreground-muted">
          Quantos dias antes da data de entrega o cliente deve fazer o pedido.
          Use <span className="font-medium">0</span> para permitir pedidos no
          mesmo dia, ou <span className="font-medium">1</span> para exigir pelo
          menos um dia de antecedência.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="minimumAdvanceDays"
            className="text-xs font-medium text-foreground-muted"
          >
            Dias de antecedência
          </label>
          <input
            id="minimumAdvanceDays"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="1"
            value={days}
            disabled={isPending}
            onChange={(e) => {
              setDays(e.target.value);
              setFeedback(null);
            }}
            className="rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 w-32"
          />
        </div>

        {feedback && (
          <InlineFeedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isPending}
          disabled={isPending}
          className="self-start"
        >
          Salvar prazo mínimo
        </Button>
      </form>
    </section>
  );
}
