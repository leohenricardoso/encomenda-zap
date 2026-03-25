// ─── Component ────────────────────────────────────────────────────────────────

interface OrderNotesCardProps {
  notes: string;
  waUrl?: string;
}

/**
 * OrderNotesCard — visually highlighted block for customer observations.
 *
 * Uses amber colouring so store staff immediately notice special instructions
 * during order preparation. Only rendered when notes are present.
 */
export function OrderNotesCard({ notes, waUrl }: OrderNotesCardProps) {
  return (
    <section
      aria-label="Observações do cliente"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 h-4 w-4 text-amber-600">
          <AlertTriangleIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
            Observações do cliente
          </p>
          <p className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
            {notes}
          </p>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.478 2 12c0 1.85.504 3.58 1.383 5.063L2 22l5.09-1.368A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm0 18a7.95 7.95 0 0 1-4.086-1.126l-.293-.174-3.022.812.824-2.954-.19-.303A7.95 7.95 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8Z"
                  clipRule="evenodd"
                />
              </svg>
              Falar com cliente sobre observação
            </a>
          )}
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
