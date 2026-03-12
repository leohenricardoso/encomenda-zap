import { FulfillmentType } from "@/domain/order/Order";
import { formatCurrency } from "./helpers";

// ─── Component ────────────────────────────────────────────────────────────────

interface FinancialSummaryCardProps {
  items: Array<{
    unitPrice: number;
    discountAmount: number;
    quantity: number;
  }>;
  deliveryFee: number;
  fulfillmentType: FulfillmentType;
}

/**
 * FinancialSummaryCard — subtotal, delivery fee, and order total.
 *
 * The delivery fee row is shown for DELIVERY orders (even when 0, displayed
 * as "Grátis"). For PICKUP orders the row is omitted entirely.
 */
export function FinancialSummaryCard({
  items,
  deliveryFee,
  fulfillmentType,
}: FinancialSummaryCardProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice - item.discountAmount) * item.quantity,
    0,
  );
  const total = subtotal + deliveryFee;
  const isDelivery = fulfillmentType === FulfillmentType.DELIVERY;

  return (
    <section aria-label="Resumo financeiro">
      <SectionLabel icon={<ReceiptIcon />}>Resumo financeiro</SectionLabel>

      <div className="mt-3 rounded-xl border border-line bg-surface overflow-hidden">
        <div className="divide-y divide-line">
          {/* Subtotal */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground-muted">Subtotal</span>
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Delivery fee — only for DELIVERY orders */}
          {isDelivery && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-foreground-muted">Frete</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"}
              </span>
            </div>
          )}
        </div>

        {/* Total row — highlighted footer */}
        <div className="flex items-center justify-between border-t border-line bg-surface-subtle px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Section label helper ─────────────────────────────────────────────────────

function SectionLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
      {icon && <span className="h-3.5 w-3.5 shrink-0">{icon}</span>}
      {children}
    </h2>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function ReceiptIcon() {
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
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
