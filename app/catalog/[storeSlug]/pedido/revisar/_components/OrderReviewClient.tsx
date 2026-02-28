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
  setDeliveryAddress,
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
  orderNumber: number | null;
  storeName: string;
  total: number;
  deliveryDate: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
  pickupTime: string | null;
  deliveryCep: string | null;
  deliveryStreet: string | null;
  deliveryNumber: string | null;
  deliveryNeighborhood: string | null;
  deliveryCity: string | null;
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

function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : cep;
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
            className="min-w-7 text-center text-sm font-semibold text-foreground"
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
      <div className="w-full max-w-120 space-y-8">
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
            {confirmation.orderNumber != null ? (
              <div className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-widest text-surface/70">
                  Pedido nº
                </span>
                <span className="text-2xl font-extrabold tabular-nums text-surface">
                  #{confirmation.orderNumber}
                </span>
              </div>
            ) : null}
            <p className="text-sm text-foreground-muted">
              {confirmation.storeName} vai entrar em contacto no seu WhatsApp.
            </p>
            {confirmation.orderNumber != null && (
              <p className="text-xs text-foreground-muted/70">
                Guarde esse número para referência.
              </p>
            )}
          </div>
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <SectionLabel>Confirmação</SectionLabel>

            {confirmation.orderNumber != null ? (
              <div className="flex items-center gap-3 rounded-lg bg-surface-subtle p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground shrink-0">
                  <span className="text-sm font-extrabold tabular-nums text-surface">
                    #{confirmation.orderNumber}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-foreground-muted">Pedido nº</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {confirmation.orderNumber}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-surface-subtle p-3">
                <p className="text-xs text-foreground-muted">Referência</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground break-all">
                  {confirmation.reference}
                </p>
              </div>
            )}

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
                  {confirmation.fulfillmentType === "DELIVERY"
                    ? "Tipo de entrega"
                    : "Retirada"}
                </p>
                <p className="mt-0.5 font-medium text-foreground">
                  {confirmation.fulfillmentType === "PICKUP"
                    ? `Retirada na loja${confirmation.pickupTime ? ` · ${confirmation.pickupTime}` : ""}`
                    : "Entrega em domicílio"}
                </p>
              </div>
              {confirmation.fulfillmentType === "DELIVERY" && (
                <div className="col-span-2">
                  <p className="text-xs text-foreground-muted">
                    Endereço de entrega
                  </p>
                  <p className="mt-0.5 font-medium text-foreground">
                    {[
                      confirmation.deliveryStreet && confirmation.deliveryNumber
                        ? `${confirmation.deliveryStreet}, ${confirmation.deliveryNumber}`
                        : null,
                      confirmation.deliveryNeighborhood,
                      confirmation.deliveryCity,
                      confirmation.deliveryCep
                        ? `CEP ${formatCep(confirmation.deliveryCep)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" – ")}
                  </p>
                </div>
              )}
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
  const [fulfillmentType, setFulfillmentTypeState] = useState<
    "pickup" | "delivery"
  >("pickup");
  const [shippingCep, setShippingCepState] = useState<string | null>(null);
  const [pickupTime, setPickupTimeState] = useState<string | null>(null);
  const [deliveryStreet, setDeliveryStreetState] = useState<string>("");
  const [deliveryNumber, setDeliveryNumberState] = useState<string>("");
  const [deliveryNeighborhood, setDeliveryNeighborhoodState] =
    useState<string>("");
  const [deliveryCity, setDeliveryCityState] = useState<string>("");
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
    if (cart.fulfillmentType) setFulfillmentTypeState(cart.fulfillmentType);
    if (cart.shippingCep) setShippingCepState(cart.shippingCep);
    if (cart.pickupTime) setPickupTimeState(cart.pickupTime);
    if (cart.deliveryStreet) setDeliveryStreetState(cart.deliveryStreet);
    if (cart.deliveryNumber) setDeliveryNumberState(cart.deliveryNumber);
    if (cart.deliveryNeighborhood)
      setDeliveryNeighborhoodState(cart.deliveryNeighborhood);
    if (cart.deliveryCity) setDeliveryCityState(cart.deliveryCity);
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

    // Validate delivery address before submitting
    if (fulfillmentType === "delivery") {
      if (!shippingCep) {
        setSubmitError("CEP de entrega é obrigatório.");
        return;
      }
      if (
        !deliveryStreet.trim() ||
        !deliveryNumber.trim() ||
        !deliveryNeighborhood.trim() ||
        !deliveryCity.trim()
      ) {
        setSubmitError("Preencha todos os campos de endereço para continuar.");
        return;
      }
    }

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
          fulfillmentType:
            fulfillmentType === "delivery" ? "DELIVERY" : "PICKUP",
          pickupTime:
            fulfillmentType === "pickup" ? (pickupTime ?? null) : null,
          pickupSlotId:
            fulfillmentType === "pickup"
              ? (cartSession.pickupSlotId ?? null)
              : null,
          deliveryCep:
            fulfillmentType === "delivery" ? (shippingCep ?? null) : null,
          deliveryStreet:
            fulfillmentType === "delivery" ? deliveryStreet || null : null,
          deliveryNumber:
            fulfillmentType === "delivery" ? deliveryNumber || null : null,
          deliveryNeighborhood:
            fulfillmentType === "delivery"
              ? deliveryNeighborhood || null
              : null,
          deliveryCity:
            fulfillmentType === "delivery" ? deliveryCity || null : null,
          deliveryDate: new Date(`${deliveryDate}T12:00:00`).toISOString(),
          notes: cartSession.notes ?? null,
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
      <div className="w-full max-w-130 space-y-6">
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
                <div className="flex items-center gap-2">
                  <SectionLabel>
                    <span id="section-delivery">
                      {fulfillmentType === "pickup"
                        ? "Retirada na loja"
                        : "Entrega em domicílio"}
                    </span>
                  </SectionLabel>
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      fulfillmentType === "pickup"
                        ? "bg-accent/10 text-accent"
                        : "bg-surface-hover text-foreground-muted",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {fulfillmentType === "pickup" ? (
                      <StoreIcon className="h-3 w-3" />
                    ) : (
                      <TruckIcon className="h-3 w-3" />
                    )}
                    {fulfillmentType === "pickup" ? "Retirada" : "Entrega"}
                  </span>
                </div>
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
              {fulfillmentType === "pickup" && pickupTime && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-foreground-muted">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>
                    Horário:{" "}
                    <span className="font-medium text-foreground">
                      {pickupTime}
                    </span>
                  </span>
                </div>
              )}
              {fulfillmentType === "delivery" && (
                <div className="mt-3 space-y-2">
                  {shippingCep && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      <TruckIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        CEP{" "}
                        <span className="font-medium text-foreground">
                          {formatCep(shippingCep)}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs text-foreground-muted">
                        Rua <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryStreet}
                        onChange={(e) => {
                          setDeliveryStreetState(e.target.value);
                          if (cartSession) {
                            const next = setDeliveryAddress(cartSession, {
                              street: e.target.value,
                            });
                            writeCart(next);
                            setCartSession(next);
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Nome da rua"
                        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground-muted">
                        Número <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryNumber}
                        onChange={(e) => {
                          setDeliveryNumberState(e.target.value);
                          if (cartSession) {
                            const next = setDeliveryAddress(cartSession, {
                              number: e.target.value,
                            });
                            writeCart(next);
                            setCartSession(next);
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Nº / Apto"
                        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-foreground-muted">
                        Bairro <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryNeighborhood}
                        onChange={(e) => {
                          setDeliveryNeighborhoodState(e.target.value);
                          if (cartSession) {
                            const next = setDeliveryAddress(cartSession, {
                              neighborhood: e.target.value,
                            });
                            writeCart(next);
                            setCartSession(next);
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Bairro"
                        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-foreground-muted">
                        Cidade <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryCity}
                        onChange={(e) => {
                          setDeliveryCityState(e.target.value);
                          if (cartSession) {
                            const next = setDeliveryAddress(cartSession, {
                              city: e.target.value,
                            });
                            writeCart(next);
                            setCartSession(next);
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Cidade"
                        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}
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

function StoreIcon({ className }: { className?: string }) {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
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
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
