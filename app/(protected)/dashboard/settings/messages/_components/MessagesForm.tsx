"use client";

import React, { useState, useTransition } from "react";
import {
  DEFAULT_MESSAGES,
  MESSAGE_PLACEHOLDERS,
  MESSAGE_MAX_LENGTH,
  renderMessage,
} from "@/domain/store/StoreMessageConfig";
import { saveMessages } from "../actions";
import { Button } from "../../../../../_components/Button";
import { InlineFeedback } from "../../../../../_components/InlineFeedback";

// ─── Demo vars for the live preview ──────────────────────────────────────────

const DEMO_VARS = {
  cliente: "Maria Silva",
  pedido: "42",
  data: "sexta-feira, 6 de março",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlaceholderLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {MESSAGE_PLACEHOLDERS.map(({ key, description }) => (
        <span
          key={key}
          title={description}
          className="inline-flex items-center gap-1 rounded-md bg-surface border border-line px-2 py-0.5 text-xs font-mono text-accent cursor-default"
        >
          {key}
          <span className="font-sans text-foreground-muted">
            — {description}
          </span>
        </span>
      ))}
    </div>
  );
}

interface TemplateFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}

function TemplateField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: TemplateFieldProps) {
  const remaining = MESSAGE_MAX_LENGTH - value.length;
  const isOverLimit = remaining < 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span
          className={[
            "text-xs tabular-nums",
            isOverLimit ? "text-danger font-semibold" : "text-foreground-muted",
          ].join(" ")}
        >
          {remaining}
        </span>
      </div>
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full resize-y rounded-lg border px-3 py-2.5 text-sm bg-surface text-foreground placeholder:text-foreground-muted",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 transition",
          isOverLimit ? "border-danger" : "border-line",
        ].join(" ")}
      />
    </div>
  );
}

interface PreviewProps {
  label: string;
  template: string;
}

function Preview({ label, template }: PreviewProps) {
  const rendered = renderMessage(template || " ", DEMO_VARS);

  return (
    <div className="rounded-lg border border-line bg-surface-hover p-3 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
        Preview — {label}
      </p>
      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
        {rendered.trim() || (
          <span className="italic text-foreground-muted">
            (mensagem padrão será usada)
          </span>
        )}
      </p>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface MessagesFormProps {
  initialApproval: string | null;
  initialRejection: string | null;
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

export function MessagesForm({
  initialApproval,
  initialRejection,
}: MessagesFormProps) {
  const [approval, setApproval] = useState(
    initialApproval ?? DEFAULT_MESSAGES.approval,
  );
  const [rejection, setRejection] = useState(
    initialRejection ?? DEFAULT_MESSAGES.rejection,
  );
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await saveMessages(approval.trim() || null, rejection.trim() || null);
        setFeedback({
          type: "success",
          message: "Mensagens salvas com sucesso.",
        });
        setTimeout(() => setFeedback(null), 3500);
      } catch {
        setFeedback({
          type: "error",
          message: "Erro ao salvar. Tente novamente.",
        });
      }
    });
  }

  const canSave =
    !isPending &&
    approval.length <= MESSAGE_MAX_LENGTH &&
    rejection.length <= MESSAGE_MAX_LENGTH;

  return (
    <div className="space-y-8">
      {/* ── Section header ─────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          Mensagens WhatsApp
        </h2>
        <p className="text-sm text-foreground-muted">
          Personalize as mensagens enviadas aos clientes. Use os marcadores
          abaixo para incluir dados do pedido.
        </p>
      </div>

      {/* ── Placeholder legend ────────────────────────────────────────── */}
      <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
          Marcadores disponíveis
        </p>
        <PlaceholderLegend />
      </div>

      {/* ── Approval message ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <h3 className="font-semibold text-foreground">Pedido aprovado</h3>
        </div>
        <TemplateField
          id="approval"
          label="Mensagem de aprovação"
          value={approval}
          placeholder={DEFAULT_MESSAGES.approval}
          onChange={setApproval}
        />
        <Preview label="aprovação" template={approval} />
      </div>

      {/* ── Rejection message ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <h3 className="font-semibold text-foreground">Pedido recusado</h3>
        </div>
        <TemplateField
          id="rejection"
          label="Mensagem de recusa"
          value={rejection}
          placeholder={DEFAULT_MESSAGES.rejection}
          onChange={setRejection}
        />
        <Preview label="recusa" template={rejection} />
      </div>

      {/* ── Feedback banner ────────────────────────────────────────────── */}
      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={
            feedback.type === "error" ? () => setFeedback(null) : undefined
          }
        />
      )}

      {/* ── Save button ────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          loading={isPending}
        >
          {isPending ? "Salvando…" : "Salvar mensagens"}
        </Button>
      </div>
    </div>
  );
}
