import type { OrderItem } from "@/domain/order/OrderItem";
import { formatCurrency } from "./helpers";

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderItemsCardProps {
  items: OrderItem[];
}

/**
 * OrderItemsCard — order line items for preparation.
 *
 * Each row shows: quantity badge, product name, variant, unit price breakdown
 * and line total. Financial summary lives in FinancialSummaryCard.
 */
export function OrderItemsCard({ items }: OrderItemsCardProps) {
  return (
    <section aria-label="Itens do pedido">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
        <span className="h-3.5 w-3.5 shrink-0">
          <ShoppingBagIcon />
        </span>
        Itens do pedido
      </h2>

      <div className="mt-3 rounded-xl border border-line bg-surface overflow-hidden">
        <ul className="divide-y divide-line">
          {items.map((item, i) => {
            const linePrice = item.unitPrice - item.discountAmount;
            const lineTotal = linePrice * item.quantity;
            const hasDiscount = item.discountAmount > 0;

            return (
              <li
                key={item.id ?? i}
                className="flex items-start justify-between gap-3 px-4 py-3.5"
              >
                {/* Qty badge + product name */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-surface-subtle border border-line text-sm font-bold text-foreground-muted tabular-nums">
                    {item.quantity}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground leading-snug">
                      {item.productName}
                    </p>
                    {item.variantLabel && (
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {item.variantLabel}
                      </p>
                    )}
                    {hasDiscount && (
                      <p className="text-xs text-green-700 mt-0.5">
                        Desconto: −{formatCurrency(item.discountAmount)}/un
                      </p>
                    )}
                  </div>
                </div>

                {/* Price column */}
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(lineTotal)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-foreground-muted tabular-nums mt-0.5">
                      {formatCurrency(linePrice)} × {item.quantity}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function ShoppingBagIcon() {
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
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
