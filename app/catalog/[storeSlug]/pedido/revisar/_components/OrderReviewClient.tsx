"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { readCart, clearCart } from "../../../_lib/cart";
import type { CartItem } from "../../../_lib/cart";
import {
  CUSTOMER_SESSION_KEY,
  type CustomerSession,
} from "../../../identificar/_components/CustomerIdentityForm";
import { Button } from "../../../../../_components/Button";
import { Card } from "../../../../../_components/Card";

// ─── Local types ──────────────────────────────────────────────────────────────

/**
 * Minimal shape of the order confirmation returned by POST /api/orders.
 * Defined locally to avoid importing server-side modules in a Client Component.
 */
interface OrderConfirmation {
  reference: string;
  storeName: string;
  total: number;
  deliveryDate: string;
  customer: { name: string; whatsapp: string };
}

type PageState = "loading" | "review" | "submitting" | "success" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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

interface OrderItemRowProps {
  item: CartItem;
}

function OrderItemRow({ item }: OrderItemRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          {item.productName}
        </p>
        {item.variantLabel && (
          <p className="mt-0.5 text-xs text-foreground-muted">
            {item.variantLabel}
          </p>
        )}
        <p className="mt-1 text-xs text-foreground-muted">
          {item.quantity} × {formatCurrency(item.unitPrice)}
        </p>
      </div>
      <p className="text-sm font-semibold text-foreground shrink-0">
        {formatCurrency(item.lineTotal)}
      </p>
    </div>
  );
}

interface SuccessViewProps {
  confirmation: OrderConfirmation;
  storeSlug: string;
  onNewOrder: () => void;
}

function SuccessView({
  confirmation,
  storeSlug,
  onNewOrder,
}: SuccessViewProps) {
  return (
    <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px] space-y-8">
        {/* ── Icon + heading ── */}
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

        {/* ── Summary card ── */}
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
                    typeof confirmation.deliveryDate === "string"
                      ? confirmation.deliveryDate.split("T")[0]!
                      : new Date(confirmation.deliveryDate)
                          .toISOString()
                          .split("T")[0]!,
                  )}
                </p>
              </div>
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

// ─── Main component ───────────────────────────────────────────────────────────

interface OrderReviewClientProps {
  storeSlug: string;
}

export function OrderReviewClient({ storeSlug }: OrderReviewClientProps) {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>(tomorrowISO());
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  );

  // ── Hydrate from sessionStorage ───────────────────────────────────────────
  useEffect(() => {
    const rawCustomer = sessionStorage.getItem(CUSTOMER_SESSION_KEY);
    const cart = readCart();

    const missingCustomer = !rawCustomer;
    const missingCart =
      !cart || cart.storeSlug !== storeSlug || cart.items.length === 0;

    if (missingCustomer) {
      // No customer — send back to identificar
      router.replace(`/catalog/${storeSlug}/identificar`);
      return;
    }

    if (missingCart) {
      // No valid cart — send back to catalog
      router.replace(`/catalog/${storeSlug}`);
      return;
    }

    const parsed = JSON.parse(rawCustomer) as CustomerSession;
    setCustomer(parsed);
    setCartItems(cart.items);
    if (cart.shippingAddress) setShippingAddress(cart.shippingAddress);
    setPageState("review");
  }, [storeSlug, router]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const total = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!customer) return;
    setSubmitError(null);
    setPageState("submitting");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          customer: {
            name: customer.name,
            whatsapp: customer.whatsapp,
          },
          items: cartItems.map((item) => ({
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
        "Não foi possível enviar o pedido. Verifique sua conexão e tente novamente.",
      );
      setPageState("review");
    }
  }

  function handleBack() {
    router.push(`/catalog/${storeSlug}`);
  }

  function handleNewOrder() {
    router.push(`/catalog/${storeSlug}`);
  }

  // ── Render: loading / redirecting ─────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-dvh bg-surface-subtle flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-foreground" />
      </div>
    );
  }

  // ── Render: success ───────────────────────────────────────────────────────
  if (pageState === "success" && confirmation) {
    return (
      <SuccessView
        confirmation={confirmation}
        storeSlug={storeSlug}
        onNewOrder={handleNewOrder}
      />
    );
  }

  // ── Render: review form ────────────────────────────────────────────────────
  const isSubmitting = pageState === "submitting";

  return (
    <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px] space-y-8">
        {/* ── Header ── */}
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
              Confira os detalhes antes de confirmar.
            </p>
          </div>
        </div>

        {/* ── Main card ── */}
        <Card>
          <div className="flex flex-col gap-5">
            {/* Customer */}
            <section aria-labelledby="section-customer">
              <SectionLabel>
                <span id="section-customer">Seus dados</span>
              </SectionLabel>
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
                    {customer ? formatWhatsApp(customer.whatsapp) : "—"}
                  </p>
                </div>
              </div>
            </section>

            <Divider />

            {/* Order items */}
            <section aria-labelledby="section-items">
              <SectionLabel>
                <span id="section-items">Itens do pedido</span>
              </SectionLabel>
              <div className="mt-3 flex flex-col gap-4">
                {cartItems.map((item, idx) => (
                  <OrderItemRow
                    key={`${item.productId}-${item.variantId ?? "base"}-${idx}`}
                    item={item}
                  />
                ))}
              </div>
            </section>

            <Divider />

            {/* Total */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Total</p>
              <p className="text-base font-bold text-foreground">
                {formatCurrency(total)}
              </p>
            </div>

            <Divider />

            {/* Delivery date */}
            <section aria-labelledby="section-delivery">
              <SectionLabel>
                <span id="section-delivery">Data de entrega</span>
              </SectionLabel>
              <div className="mt-3">
                <input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  min={tomorrowISO()}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={isSubmitting}
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-sm",
                    "border-line bg-surface text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors duration-150",
                  ].join(" ")}
                />
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
              <div className="mt-3">
                <input
                  id="shippingAddress"
                  type="text"
                  placeholder="Rua, número, bairro, cidade…"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  disabled={isSubmitting}
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-sm",
                    "border-line bg-surface text-foreground placeholder:text-foreground-muted",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors duration-150",
                  ].join(" ")}
                />
              </div>
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
                disabled={isSubmitting}
                onClick={handleConfirm}
              >
                {isSubmitting ? "Enviando pedido…" : "Confirmar pedido"}
              </Button>

              <Button
                variant="ghost"
                size="md"
                disabled={isSubmitting}
                onClick={handleBack}
              >
                ← Voltar e ajustar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
