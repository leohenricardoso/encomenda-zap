import type { OrderViewModel } from "./types";
import { OrderCard } from "./OrderCard";

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderListProps {
  /** Section title, e.g. "Hoje", "Amanhã", "sexta-feira, 6 de março". */
  title: string;
  orders: OrderViewModel[];
  /**
   * When true, renders the title in accent colour and adds a live-pulse dot.
   * Use for the "Hoje" section.
   */
  highlighted?: boolean;
  /** Custom empty-state message. Defaults to "Nenhum pedido". */
  emptyMessage?: string;
}

/**
 * OrderList — titled section with a list of OrderCards.
 *
 * Returns null when `orders` is empty so the parent can skip the section
 * altogether (useful for "tomorrow" when there are no orders).
 *
 * Designed as a Server Component — no interactivity required.
 */
export function OrderList({
  title,
  orders,
  highlighted = false,
  emptyMessage = "Nenhum pedido",
}: OrderListProps) {
  return (
    <section aria-label={title} className="space-y-3">
      {/* ── Section header ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {highlighted && (
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-accent animate-pulse"
          />
        )}
        <h2
          className={[
            "text-base font-semibold",
            highlighted ? "text-foreground" : "text-foreground-muted",
          ].join(" ")}
        >
          {title}
        </h2>
        <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
          {orders.length}
        </span>
      </div>

      {/* ── Order list ────────────────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-foreground-muted">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order, i) => (
            <li key={`${order.customerName}-${order.deliveryDate}-${i}`}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
