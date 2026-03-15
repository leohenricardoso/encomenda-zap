"use client";

import type { StoreStatus } from "@/domain/store/types";

const STATUS_LABELS: Record<StoreStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  SUSPENDED: "Suspensa",
};

const STATUS_STYLES: Record<StoreStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-500 border border-slate-200",
  SUSPENDED: "bg-red-50 text-red-700 border border-red-200",
};

interface StoreStatusBadgeProps {
  status: StoreStatus;
}

export function StoreStatusBadge({ status }: StoreStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      ].join(" ")}
    >
      <span
        className={[
          "mr-1.5 size-1.5 rounded-full",
          status === "ACTIVE"
            ? "bg-emerald-500"
            : status === "SUSPENDED"
              ? "bg-red-500"
              : "bg-slate-400",
        ].join(" ")}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
