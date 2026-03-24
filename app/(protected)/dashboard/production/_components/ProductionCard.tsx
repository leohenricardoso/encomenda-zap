import type { DailyProductionItem } from "@/domain/production/DailyProduction";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductionCardProps {
  item: DailyProductionItem;
  produced: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onViewOrders: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductionCard({
  item,
  produced,
  isLoading,
  onToggle,
  onViewOrders,
}: ProductionCardProps) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-colors ${
        produced ? "bg-green-50/60" : "bg-surface"
      }`}
    >
      {/* ── Checkbox ────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggle}
        disabled={isLoading}
        aria-label={
          produced
            ? `Desmarcar ${item.productName} como produzido`
            : `Marcar ${item.productName} como produzido`
        }
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors print:hidden ${
          isLoading
            ? "cursor-wait opacity-50 border-line"
            : produced
              ? "border-green-500 bg-green-500 hover:border-green-600 hover:bg-green-600"
              : "border-line bg-surface hover:border-accent"
        }`}
      >
        {produced && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="white"
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        )}
      </button>

      {/* Print-only indicator */}
      <span className="hidden print:inline-block w-5 h-5 border border-gray-400 rounded shrink-0" />

      {/* ── Product info ─────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-tight transition-colors ${
            produced ? "text-muted line-through" : "text-foreground"
          }`}
        >
          {item.productName}
        </p>
        {item.variationLabel && (
          <p className="mt-0.5 text-xs text-muted">{item.variationLabel}</p>
        )}
        {/* Observation badge */}
        {item.orders.some((o) => o.notes) ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
            Com observação
          </span>
        ) : (
          <span className="mt-1 inline-flex items-center rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted">
            Sem observação
          </span>
        )}
      </div>

      {/* ── Quantity badge ───────────────────────────────────────────────── */}
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
          produced ? "bg-green-100 text-green-700" : "bg-accent/10 text-accent"
        }`}
      >
        {item.totalQuantity}
      </span>

      {/* ── Ver pedidos button ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onViewOrders}
        className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent transition-colors print:hidden"
      >
        {item.orders.length} pedido{item.orders.length !== 1 ? "s" : ""}
      </button>
    </div>
  );
}
