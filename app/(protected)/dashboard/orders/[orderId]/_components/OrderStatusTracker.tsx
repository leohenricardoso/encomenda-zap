import { OrderTrackingStatus } from "@/domain/order/Order";

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  status: OrderTrackingStatus;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  {
    status: OrderTrackingStatus.PENDING,
    label: "Pendente",
    description: "Aguardando pagamento",
  },
  {
    status: OrderTrackingStatus.PAID,
    label: "Pago",
    description: "Pagamento confirmado",
  },
  {
    status: OrderTrackingStatus.DELIVERED,
    label: "Entregue",
    description: "Pedido entregue ao cliente",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_ORDER: Record<OrderTrackingStatus, number> = {
  [OrderTrackingStatus.PENDING]: 0,
  [OrderTrackingStatus.PAID]: 1,
  [OrderTrackingStatus.DELIVERED]: 2,
  [OrderTrackingStatus.CANCELLED]: -1,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderStatusTrackerProps {
  /** Current tracking status of the order. */
  currentStatus: OrderTrackingStatus;
}

/**
 * OrderStatusTracker — horizontal step-progress component.
 *
 * Visualises the order's journey through:
 *   Aprovado → Pendente → Pago → Entregue
 *
 * If the order is CANCELLED it renders a distinct "Cancelado" banner instead.
 *
 * Server Component — no interactivity required here. Action buttons are in
 * OrderStatusActions.
 */
export function OrderStatusTracker({ currentStatus }: OrderStatusTrackerProps) {
  // ── Cancelled state ──────────────────────────────────────────────────────
  if (currentStatus === OrderTrackingStatus.CANCELLED) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
          <BanIcon className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-800">Pedido cancelado</p>
          <p className="text-xs text-red-600">
            Este pedido foi cancelado após a aprovação.
          </p>
        </div>
      </div>
    );
  }

  const currentIdx = STEP_ORDER[currentStatus];

  return (
    <div aria-label="Progresso do pedido">
      {/* ── "Aprovado" anchor step —— always done ─────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface border border-green-600">
          <CheckIcon className="h-4 w-4 text-green-700" />
        </div>
        <div>
          <p className="text-xs font-semibold text-green-700">Aprovado</p>
          <p className="text-xs text-foreground-muted">
            Pedido aceito pela loja
          </p>
        </div>
      </div>

      {/* ── Connector ─────────────────────────────────────────────────── */}
      <div className="ml-3.5 mb-2 w-px h-4 bg-line" aria-hidden="true" />

      {/* ── Tracking steps ────────────────────────────────────────────── */}
      <ol className="flex flex-col gap-0" aria-label="Etapas do pedido">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isUpcoming = idx > currentIdx;

          return (
            <li key={step.status}>
              <div className="flex items-center gap-2">
                {/* Step circle */}
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                    isDone
                      ? "bg-surface border border-green-600"
                      : isCurrent
                        ? "bg-green-600"
                        : "border-2 border-line bg-surface",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isDone ? (
                    <CheckIcon className="h-4 w-4 text-green-700" />
                  ) : isCurrent ? (
                    <span className="h-6 w-6 flex shrink-0 items-center justify-center rounded-full transition-colors">
                      <CheckIcon className="h-4 w-4 text-white" />
                    </span>
                  ) : null}
                </div>

                {/* Step label */}
                <div>
                  <p
                    className={[
                      "text-xs font-semibold",
                      isDone
                        ? "text-green-700"
                        : isCurrent
                          ? "text-foreground"
                          : "text-foreground-muted",
                    ].join(" ")}
                  >
                    {step.label}
                  </p>
                  {!isUpcoming && (
                    <p className="text-xs text-foreground-muted">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector between steps */}
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    "ml-3.5 my-1 w-px h-5",
                    isDone ? "bg-green-400" : "bg-line",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BanIcon({ className }: { className?: string }) {
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
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
