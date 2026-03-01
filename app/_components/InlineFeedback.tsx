/**
 * InlineFeedback — consistent success / error inline banner.
 *
 * Used across:
 *   • Dashboard settings forms (save result)
 *   • Order detail status actions (error state)
 *   • Catalog order review (submit error)
 *
 * Props:
 *   type      — "success" | "error"
 *   message   — Human-readable, non-technical string
 *   onDismiss — When provided, renders an × button so the user can clear it
 *   compact   — Smaller padding + xs text (for tight spaces like StatusActions)
 */

// This is a shared presentational component — no "use client" directive needed
// since it has no hooks; the parent decides when to render it.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InlineFeedbackProps {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
  /** Uses xs text and tighter padding. Default: false (sm text). */
  compact?: boolean;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const typeStyles: Record<
  InlineFeedbackProps["type"],
  { wrapper: string; icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    wrapper: "bg-green-50 text-green-800 border border-green-200",
    icon: CheckCircleIcon,
  },
  error: {
    wrapper: "bg-red-50 text-danger border border-red-200",
    icon: AlertCircleIcon,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InlineFeedback({
  type,
  message,
  onDismiss,
  compact = false,
}: InlineFeedbackProps) {
  const { wrapper, icon: Icon } = typeStyles[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={[
        "flex items-center justify-between gap-2 rounded-lg font-medium",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        wrapper,
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <Icon
          className={compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"}
        />
        <span className="leading-snug">{message}</span>
      </span>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <XIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </button>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
