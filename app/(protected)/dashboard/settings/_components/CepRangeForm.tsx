/**
 * CepRangeForm — Admin client component for managing the store's CEP delivery ranges.
 *
 * A store can have multiple CEP ranges. A customer's CEP is accepted if it
 * falls within ANY configured range. When no ranges exist, delivery is unrestricted.
 *
 * Rules:
 *  - CEPs are stored as 8-digit numeric strings (no hyphen).
 *  - Display uses the XXXXX-XXX mask.
 *  - cepStart ≤ cepEnd validated client-side and server-side.
 *  - Saving calls   POST   /api/cep-range          { cepStart, cepEnd }
 *  - Removing calls DELETE /api/cep-range/:id
 */

"use client";

import { useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rawCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatCep(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function applyCepMask(value: string): string {
  return formatCep(value);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CepRange {
  id: string;
  cepStart: string; // 8-digit raw
  cepEnd: string; // 8-digit raw
}

interface CepRangeFormProps {
  initialRanges: CepRange[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CepRangeForm({ initialRanges }: CepRangeFormProps) {
  const [ranges, setRanges] = useState<CepRange[]>(initialRanges);

  // New-range form state
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [addStatus, setAddStatus] = useState<"idle" | "adding" | "error">(
    "idle",
  );
  const [addError, setAddError] = useState<string | null>(null);

  // Per-item removal state
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Transient success notice
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ── Add handler ──────────────────────────────────────────────────────────
  function validateNew(): string | null {
    const s = rawCep(newStart);
    const e = rawCep(newEnd);
    if (s.length !== 8) return "CEP inicial inválido — insira 8 dígitos.";
    if (e.length !== 8) return "CEP final inválido — insira 8 dígitos.";
    if (s > e) return "CEP inicial deve ser menor ou igual ao CEP final.";
    return null;
  }

  async function handleAdd() {
    const err = validateNew();
    if (err) {
      setAddError(err);
      setAddStatus("error");
      return;
    }

    setAddStatus("adding");
    setAddError(null);

    try {
      const res = await fetch("/api/cep-range", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cepStart: rawCep(newStart),
          cepEnd: rawCep(newEnd),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Erro ao adicionar faixa.");
      }

      const data = (await res.json()) as { data: { range: CepRange } };
      setRanges((prev) => [...prev, data.data.range]);
      setNewStart("");
      setNewEnd("");
      setAddStatus("idle");
      flash("Faixa adicionada com sucesso.");
    } catch (e) {
      setAddError((e as Error).message);
      setAddStatus("error");
    }
  }

  // ── Remove handler ───────────────────────────────────────────────────────
  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/cep-range/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover faixa.");
      setRanges((prev) => prev.filter((r) => r.id !== id));
      flash("Faixa removida.");
    } catch {
      // noop — could show a per-item error but keep it simple
    } finally {
      setRemovingId(null);
    }
  }

  const isUnrestricted = ranges.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="rounded-2xl border border-line bg-surface shadow-sm">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-line px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-hover">
            <TruckIcon className="h-5 w-5 text-foreground-muted" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Área de entrega
            </h2>
            <p className="mt-0.5 text-[13px] text-foreground-muted leading-relaxed">
              Defina uma ou mais faixas de CEP para restringir entregas. Sem
              faixas configuradas, todos os CEPs são aceitos.
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 space-y-4">
        {/* Status badge */}
        <div
          className={[
            "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
            isUnrestricted
              ? "border-line bg-surface-hover text-foreground-muted"
              : "border-accent/30 bg-accent/5 text-accent",
          ].join(" ")}
        >
          {isUnrestricted ? (
            <>
              <GlobeIcon className="h-4 w-4 shrink-0" />
              <span>Sem restrição — todos os CEPs são aceitos</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              <span>
                {ranges.length === 1
                  ? "1 faixa de CEP configurada"
                  : `${ranges.length} faixas de CEP configuradas`}
              </span>
            </>
          )}
        </div>

        {/* Success notice */}
        {successMsg && (
          <p
            role="status"
            className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
            {successMsg}
          </p>
        )}

        {/* Existing ranges list */}
        {ranges.length > 0 && (
          <ul className="space-y-2">
            {ranges.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-subtle px-4 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPinIcon className="h-4 w-4 shrink-0 text-foreground-muted" />
                  <span className="text-sm font-mono text-foreground tabular-nums">
                    {formatCep(r.cepStart)}
                  </span>
                  <span className="text-xs text-foreground-muted">até</span>
                  <span className="text-sm font-mono text-foreground tabular-nums">
                    {formatCep(r.cepEnd)}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`Remover faixa ${formatCep(r.cepStart)} – ${formatCep(r.cepEnd)}`}
                  disabled={removingId === r.id}
                  onClick={() => handleRemove(r.id)}
                  className={[
                    "flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 py-1.5",
                    "text-xs font-medium text-danger shrink-0",
                    "hover:bg-danger/5 transition-colors duration-150",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-1",
                  ].join(" ")}
                >
                  {removingId === r.id ? (
                    <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <TrashIcon className="h-3.5 w-3.5" />
                  )}
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* ── Add new range ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-line bg-surface-subtle p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Adicionar nova faixa
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="newCepStart"
                className="text-xs font-medium text-foreground-muted"
              >
                CEP inicial
              </label>
              <input
                id="newCepStart"
                type="text"
                inputMode="numeric"
                placeholder="00000-000"
                maxLength={9}
                value={newStart}
                disabled={addStatus === "adding"}
                onChange={(e) => {
                  setNewStart(applyCepMask(e.target.value));
                  if (addStatus === "error") setAddStatus("idle");
                }}
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="newCepEnd"
                className="text-xs font-medium text-foreground-muted"
              >
                CEP final
              </label>
              <input
                id="newCepEnd"
                type="text"
                inputMode="numeric"
                placeholder="99999-999"
                maxLength={9}
                value={newEnd}
                disabled={addStatus === "adding"}
                onChange={(e) => {
                  setNewEnd(applyCepMask(e.target.value));
                  if (addStatus === "error") setAddStatus("idle");
                }}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Inline error */}
          {addStatus === "error" && addError && (
            <p
              role="alert"
              className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
            >
              <XCircleIcon className="h-4 w-4 shrink-0" />
              {addError}
            </p>
          )}

          <button
            type="button"
            disabled={addStatus === "adding"}
            onClick={handleAdd}
            className={[
              "flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5",
              "border border-accent/40 bg-accent/5 text-accent text-sm font-semibold",
              "hover:bg-accent/10 transition-colors duration-150",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
            ].join(" ")}
          >
            {addStatus === "adding" ? (
              <SpinnerIcon className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <PlusIcon className="h-4 w-4 shrink-0" />
            )}
            Adicionar faixa
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT_CLS = [
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-foreground",
  "placeholder:text-foreground-muted",
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "transition-colors duration-150",
].join(" ");

// ─── Icons ────────────────────────────────────────────────────────────────────

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
