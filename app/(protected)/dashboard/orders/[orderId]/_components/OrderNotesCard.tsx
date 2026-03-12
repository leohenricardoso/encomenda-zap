// ─── Component ────────────────────────────────────────────────────────────────

interface OrderNotesCardProps {
  notes: string;
}

/**
 * OrderNotesCard — visually highlighted block for customer observations.
 *
 * Uses amber colouring so store staff immediately notice special instructions
 * during order preparation. Only rendered when notes are present.
 */
export function OrderNotesCard({ notes }: OrderNotesCardProps) {
  return (
    <section
      aria-label="Observações do cliente"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 h-4 w-4 text-amber-600">
          <AlertTriangleIcon />
        </span>
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
            Observações do cliente
          </p>
          <p className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
            {notes}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function AlertTriangleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
