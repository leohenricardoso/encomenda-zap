import type { OrderItem } from "@/domain/order/OrderItem";
import { formatCurrency } from "./helpers";
import { SectionTitle } from "./CustomerSection";

// ─── Component ────────────────────────────────────────────────────────────────

interface ItemsSectionProps {
  items: OrderItem[];
}

/**
 * ItemsSection — line items table with quantities, names, unit prices and totals.
 */
export function ItemsSection({ items }: ItemsSectionProps) {
  const grandTotal = items.reduce(
    (sum, item) => sum + (item.unitPrice - item.discountAmount) * item.quantity,
    0,
  );

  return (
    <section aria-label="Itens do pedido">
      <SectionTitle icon={<BoxIcon />}>Itens do pedido</SectionTitle>

      <div className="mt-3 rounded-xl border border-line bg-surface overflow-hidden">
        {/* Item rows */}
        <ul className="divide-y divide-line">
          {items.map((item, i) => {
            const linePrice = item.unitPrice - item.discountAmount;
            const lineTotal = linePrice * item.quantity;
            const hasDiscount = item.discountAmount > 0;

            return (
              <li
                key={item.id ?? i}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                {/* Qty badge + product name */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-surface-subtle text-xs font-bold text-foreground-muted">
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
                      <p className="text-xs text-green-600 mt-0.5">
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

        {/* Grand total */}
        <div className="flex items-center justify-between border-t border-line bg-surface-subtle px-4 py-3">
          <span className="text-sm font-semibold text-foreground-muted uppercase tracking-wide">
            Total
          </span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function BoxIcon() {
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
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
