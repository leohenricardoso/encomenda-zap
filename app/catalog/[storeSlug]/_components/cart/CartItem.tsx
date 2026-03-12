import type { CartItem as CartItemType } from "../../_lib/cart";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  item: CartItemType;
  onQuantityChange(
    productId: string,
    variantId: string | null,
    qty: number,
  ): void;
  onRemove(productId: string, variantId: string | null): void;
}

/**
 * CartItem — a single line item inside the CartDrawer.
 * Purely presentational; all mutations go up via callbacks.
 */
export function CartItem({ item, onQuantityChange, onRemove }: Props) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-muted))] p-3">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[rgb(var(--color-text))] leading-snug">
          {item.productName}
        </p>
        {item.variantLabel && (
          <p className="mt-0.5 text-xs text-[rgb(var(--color-text-muted))]">
            {item.variantLabel}
          </p>
        )}
        <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
          {fmt(item.unitPrice)} × {item.quantity} ={" "}
          <span className="font-semibold text-[rgb(var(--color-text))]">
            {fmt(item.lineTotal)}
          </span>
        </p>
      </div>

      {/* Stepper + remove */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Diminuir"
            onClick={() =>
              onQuantityChange(
                item.productId,
                item.variantId,
                item.quantity - 1,
              )
            }
            className="flex h-6 w-6 items-center justify-center rounded border border-[rgb(var(--color-border))] text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg))] transition-colors cursor-pointer"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-semibold text-[rgb(var(--color-text))]">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar"
            onClick={() =>
              onQuantityChange(
                item.productId,
                item.variantId,
                item.quantity + 1,
              )
            }
            className="flex h-6 w-6 items-center justify-center rounded border border-[rgb(var(--color-border))] text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg))] transition-colors cursor-pointer"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.productId, item.variantId)}
          className="text-xs text-[rgb(var(--color-text-muted))] hover:text-red-500 transition-colors cursor-pointer"
        >
          Remover
        </button>
      </div>
    </li>
  );
}
