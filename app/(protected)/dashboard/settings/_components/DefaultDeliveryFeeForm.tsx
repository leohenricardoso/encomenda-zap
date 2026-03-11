"use client";

import { useState, useTransition } from "react";
import { saveDefaultDeliveryFee } from "../actions";
import { Button } from "../../../../_components/Button";
import { InlineFeedback } from "../../../../_components/InlineFeedback";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DefaultDeliveryFeeFormProps {
  initialFee: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DefaultDeliveryFeeForm({
  initialFee,
}: DefaultDeliveryFeeFormProps) {
  const [fee, setFee] = useState(initialFee > 0 ? initialFee.toFixed(2) : "");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const parsed = fee.trim() === "" ? 0 : parseFloat(fee.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) {
      setFeedback({ type: "error", message: "Informe um valor válido (≥ 0)." });
      return;
    }

    startTransition(async () => {
      const result = await saveDefaultDeliveryFee(parsed);
      if (result.success) {
        setFeedback({ type: "success", message: "Taxa padrão salva!" });
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
          Taxa de entrega padrão
        </h2>
        <p className="text-sm text-foreground-muted">
          Aplicada quando não há faixas de CEP configuradas ou a loja aceita
          entregas para qualquer região. Deixe em branco ou{" "}
          <span className="font-medium">0</span> para frete grátis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="defaultDeliveryFee"
            className="text-xs font-medium text-foreground-muted"
          >
            Valor (R$)
          </label>
          <input
            id="defaultDeliveryFee"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={fee}
            disabled={isPending}
            onChange={(e) => {
              setFee(e.target.value);
              setFeedback(null);
            }}
            className="rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
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
          Salvar taxa padrão
        </Button>
      </form>
    </section>
  );
}
