"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  readCart,
  writeCart,
  clearCart,
  removeItem,
  updateItemQuantity,
  cartItemKey,
} from "../../../_lib/cart";
import type { CartItem, CartSession } from "../../../_lib/cart";
import {
  CUSTOMER_SESSION_KEY,
  type CustomerSession,
} from "../../../identificar/_components/CustomerIdentityForm";
import { Button } from "../../../../../_components/Button";
import { Card } from "../../../../../_components/Card";

// â”€â”€â”€ Local types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface OrderConfirmation {
  reference: string;
  storeName: string;
  total: number;
  deliveryDate: string;
  customer: { name: string; whatsapp: string };
  items: {
    productName: string;
    variantLabel: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

type PageState = "loading" | "review" | "submitting" | "success";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const formatCurrency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] as string;
}

function formatDeliveryDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y as number, (m as number) - 1, d).toLocaleDateString(
    "pt-BR",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
}

function formatWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const body = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = body.slice(0, 2);
  const rest = body.slice(2);
  if (rest.length === 9) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="border-line" />;
}

// â”€â”€ Editable item row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface EditableItemRowProps {
  item: CartItem;
  disabled: boolean;
  onQuantityChange: (
    productId: string,
    variantId: string | null,
    newQty: number,
  ) => void;
  onRemove: (productId: string, variantId: string | null) => void;
}

function EditableItemRow({
  item,
  disabled,
  onQuantityChange,
  onRemove,
}: EditableItemRowProps) {
  const key = cartItemKey(item.productId, item.variantId);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3 bg-surface-subtle">
      {/* Product info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {item.productName}
          </p>
          {item.variantLabel && (
            <p className="mt-0.5 text-xs text-foreground-muted">
              {item.variantLabel}
            </p>
          )}
        </div>
        <p className="text-sm font-semibold text-foreground shrink-0">
          {formatCurrency(item.lineTotal)}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        {/* Quantity stepper */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground-muted">Qtd.</span>
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={disabled || item.quantity <= 1}
            onClick={() =>
              onQuantityChange(
                item.productId,
                item.variantId,
                item.quantity - 1,
              )
            }
            className={[
              "flex h-6 w-6 items-center justify-center rounded border text-xs font-bold",
              "border-line bg-surface transition-colors duration-100",
              disabled || item.quantity <= 1
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-surface-hover",
            ].join(" ")}
          >
            −
          </button>
          <span
            aria-live="polite"
            className="min-w-[1.75rem] text-center text-sm font-semibold text-foreground"
          >
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={disabled}
            onClick={() =>
              onQuantityChange(
                item.productId,
                item.variantId,
                item.quantity + 1,
              )
            }
            className={[
              "flex h-6 w-6 items-center justify-center rounded border text-xs font-bold",
              "border-line bg-surface transition-colors duration-100",
              disabled
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-surface-hover",
            ].join(" ")}
          >
            +
          </button>
          <span className="text-xs text-foreground-muted">
            {formatCurrency(item.unitPrice)}
          </span>
        </div>

        {/* Remove */}
        <button
          type="button"
          aria-label={`Remover ${item.productName}`}
          disabled={disabled}
          onClick={() => onRemove(item.productId, item.variantId)}
          className={[
            "text-xs text-danger transition-colors duration-100 ring-focus rounded",
            disabled ? "cursor-not-allowed opacity-40" : "hover:underline",
          ].join(" ")}
        >
          Remover
        </button>
      </div>
    </div>
  );
}

// â”€â”€ Success view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SuccessViewProps {
  confirmation: OrderConfirmation;
  onNewOrder: () => void;
}

function SuccessView({ confirmation, onNewOrder }: SuccessViewProps) {
  return (
    <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px] space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: "#25D366" }}
            aria-hidden="true"
          >
            <CheckIcon className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Pedido recebido!
            </h1>
            <p className="text-sm text-foreground-muted">
              {confirmation.storeName} vai entrar em contacto no seu WhatsApp.
            </p>
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <SectionLabel>Confirmação</SectionLabel>

            <div className="rounded-lg bg-surface-subtle p-3">
              <p className="text-xs text-foreground-muted">Número do pedido</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-foreground break-all">
                {confirmation.reference}
              </p>
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-foreground-muted">Cliente</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {confirmation.customer.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">WhatsApp</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {formatWhatsApp(confirmation.customer.whatsapp)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-foreground-muted">
                  Entrega prevista
                </p>
                <p className="mt-0.5 font-medium text-foreground capitalize">
                  {formatDeliveryDate(
                    (typeof confirmation.deliveryDate === "string"
                      ? confirmation.deliveryDate
                      : new Date(confirmation.deliveryDate).toISOString()
                    ).split("T")[0]!,
                  )}
                </p>
              </div>
            </div>

            <Divider />

            {/* Item list snapshot */}
            <div className="flex flex-col gap-2">
              {confirmation.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">
                      {item.productName}
                    </span>
                    {item.variantLabel && (
                      <span className="text-foreground-muted">
                        {" "}
                        − {item.variantLabel}
                      </span>
                    )}
                    <span className="text-foreground-muted">
                      {" "}
                      × {item.quantity}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <Divider />

            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(confirmation.total)}</span>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <button
            type="button"
            onClick={onNewOrder}
            className="text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            ← Fazer novo pedido
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface OrderReviewClientProps {
  storeSlug: string;
}

export function OrderReviewClient({ storeSlug }: OrderReviewClientProps) {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [cartSession, setCartSession] = useState<CartSession | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>(tomorrowISO());
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  );

  // â”€â”€ Hydrate from sessionStorage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const rawCustomer = sessionStorage.getItem(CUSTOMER_SESSION_KEY);
    const cart = readCart();

    if (!rawCustomer) {
      router.replace(`/catalog/${storeSlug}/identificar`);
      return;
    }
    if (!cart || cart.storeSlug !== storeSlug || cart.items.length === 0) {
      router.replace(`/catalog/${storeSlug}`);
      return;
    }
    if (!cart.deliveryDate) {
      // Date step was skipped — send the user there first
      router.replace(`/catalog/${storeSlug}/pedido/data`);
      return;
    }

    setCustomer(JSON.parse(rawCustomer) as CustomerSession);
    setCartSession(cart);
    setDeliveryDate(cart.deliveryDate!); // non-null: guarded by redirect above
    if (cart.shippingAddress) setShippingAddress(cart.shippingAddress);
    setPageState("review");
  }, [storeSlug, router]);

  // â”€â”€ Cart mutation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function applyCartMutation(next: CartSession) {
    if (next.items.length === 0) {
      // Empty cart â€” go back to catalog
      clearCart();
      router.push(`/catalog/${storeSlug}`);
      return;
    }
    writeCart(next);
    setCartSession(next);
  }

  function handleQuantityChange(
    productId: string,
    variantId: string | null,
    newQty: number,
  ) {
    if (!cartSession) return;
    const next = updateItemQuantity(
      cartSession,
      productId,
      variantId,
      newQty,
      1,
    );
    applyCartMutation(next);
  }

  function handleRemoveItem(productId: string, variantId: string | null) {
    if (!cartSession) return;
    const next = removeItem(cartSession, productId, variantId);
    applyCartMutation(next);
  }

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleConfirm() {
    if (!customer || !cartSession) return;
    setSubmitError(null);
    setPageState("submitting");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          customer: { name: customer.name, whatsapp: customer.whatsapp },
          items: cartSession.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
          })),
          shippingAddress: shippingAddress.trim() || null,
          deliveryDate: new Date(`${deliveryDate}T12:00:00`).toISOString(),
        }),
      });

      const body = (await res.json()) as
        | { success: true; data: OrderConfirmation }
        | { success: false; error: { message: string } };

      if (!body.success) {
        setSubmitError(body.error.message);
        setPageState("review");
        return;
      }

      clearCart();
      setConfirmation(body.data);
      setPageState("success");
    } catch {
      setSubmitError(
        "NÃ£o foi possÃ­vel enviar o pedido. Verifique sua conexÃ£o e tente novamente.",
      );
      setPageState("review");
    }
  }

  // â”€â”€ Render: loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (pageState === "loading") {
    return (
      <div className="min-h-dvh bg-surface-subtle flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-foreground" />
      </div>
    );
  }

  // â”€â”€ Render: success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (pageState === "success" && confirmation) {
    return (
      <SuccessView
        confirmation={confirmation}
        onNewOrder={() => router.push(`/catalog/${storeSlug}`)}
      />
    );
  }

  // â”€â”€ Render: review â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const items = cartSession?.items ?? [];
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const isSubmitting = pageState === "submitting";

  return (
    <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-start px-4 py-12">
      <div className="w-full max-w-[520px] space-y-6">
        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: "#25D366" }}
            aria-hidden="true"
          >
            <WhatsAppIcon className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Revisar pedido
            </h1>
            <p className="text-sm text-foreground-muted">
              Ajuste quantidades, adicione mais itens ou confirme.
            </p>
          </div>
        </div>

        {/* â”€â”€ Main card â”€â”€ */}
        <Card>
          <div className="flex flex-col gap-5">
            {/* Customer section */}
            <section aria-labelledby="section-customer">
              <div className="flex items-center justify-between">
                <SectionLabel>
                  <span id="section-customer">Seus dados</span>
                </SectionLabel>
                <a
                  href={`/catalog/${storeSlug}/identificar`}
                  className="text-xs text-accent hover:underline"
                >
                  Alterar
                </a>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-foreground-muted">Nome</p>
                  <p className="mt-0.5 font-medium text-foreground">
                    {customer?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-muted">WhatsApp</p>
                  <p className="mt-0.5 font-medium text-foreground">
                    {customer ? formatWhatsApp(customer.whatsapp) : "â€”"}
                  </p>
                </div>
              </div>
            </section>

            <Divider />

            {/* Items section */}
            <section aria-labelledby="section-items">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>
                  <span id="section-items">Itens ({items.length})</span>
                </SectionLabel>
                <a
                  href={`/catalog/${storeSlug}`}
                  className="text-xs text-accent hover:underline"
                >
                  + Adicionar itens
                </a>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <EditableItemRow
                    key={cartItemKey(item.productId, item.variantId)}
                    item={item}
                    disabled={isSubmitting}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            </section>

            <Divider />

            {/* Total */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Total do pedido
              </p>
              <p className="text-base font-bold text-foreground">
                {formatCurrency(total)}
              </p>
            </div>

            <Divider />

            {/* Delivery date */}
            <section aria-labelledby="section-delivery">
              <div className="flex items-center justify-between">
                <SectionLabel>
                  <span id="section-delivery">Data de entrega</span>
                </SectionLabel>
                <a
                  href={`/catalog/${storeSlug}/pedido/data`}
                  className="text-xs text-accent hover:underline"
                >
                  Alterar
                </a>
              </div>
              <div className="mt-3 rounded-lg border border-line bg-surface-subtle px-3 py-2.5 text-sm font-medium text-foreground capitalize">
                {formatDeliveryDate(deliveryDate)}
              </div>
            </section>

            {/* Shipping address (optional) */}
            <section aria-labelledby="section-address">
              <SectionLabel>
                <span id="section-address">
                  Endereço de entrega{" "}
                  <span className="normal-case font-normal text-foreground-muted tracking-normal">
                    (opcional)
                  </span>
                </span>
              </SectionLabel>
              <input
                id="shippingAddress"
                type="text"
                placeholder="Rua, número, bairro, cidade…"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                disabled={isSubmitting}
                className={[
                  "mt-2 w-full rounded-lg border px-3 py-2 text-sm",
                  "border-line bg-surface text-foreground placeholder:text-foreground-muted",
                  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors duration-150",
                ].join(" ")}
              />
            </section>

            {/* Error banner */}
            {submitError && (
              <div
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3"
              >
                <p className="text-sm text-danger">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-1">
              <Button
                variant="primary"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting || items.length === 0}
                onClick={handleConfirm}
              >
                {isSubmitting
                  ? "Enviando pedido…"
                  : `Confirmar pedido ${formatCurrency(total)}`}
              </Button>

              <Button
                variant="ghost"
                size="md"
                disabled={isSubmitting}
                onClick={() => router.push(`/catalog/${storeSlug}`)}
              >
                ← Voltar ao catálogo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// â”€â”€â”€ Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="WhatsApp"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
