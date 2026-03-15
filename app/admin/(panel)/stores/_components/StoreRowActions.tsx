"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StoreStatus } from "@/domain/store/types";

interface StoreRowActionsProps {
  storeId: string;
  currentStatus: StoreStatus;
}

const STATUS_ACTIONS: Record<
  StoreStatus,
  { label: string; nextStatus: StoreStatus; style: string }[]
> = {
  ACTIVE: [
    {
      label: "Desativar",
      nextStatus: "INACTIVE",
      style: "text-slate-600 hover:bg-slate-100",
    },
    {
      label: "Suspender",
      nextStatus: "SUSPENDED",
      style: "text-red-600 hover:bg-red-50",
    },
  ],
  INACTIVE: [
    {
      label: "Ativar",
      nextStatus: "ACTIVE",
      style: "text-emerald-600 hover:bg-emerald-50",
    },
    {
      label: "Suspender",
      nextStatus: "SUSPENDED",
      style: "text-red-600 hover:bg-red-50",
    },
  ],
  SUSPENDED: [
    {
      label: "Reativar",
      nextStatus: "ACTIVE",
      style: "text-emerald-600 hover:bg-emerald-50",
    },
    {
      label: "Desativar",
      nextStatus: "INACTIVE",
      style: "text-slate-600 hover:bg-slate-100",
    },
  ],
};

export function StoreRowActions({
  storeId,
  currentStatus,
}: StoreRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(nextStatus: StoreStatus) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message ?? "Erro ao alterar status.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Erro de rede.");
    }
  }

  const actions = STATUS_ACTIONS[currentStatus];

  return (
    <div className="flex items-center gap-1">
      {actions.map(({ label, nextStatus, style }) => (
        <button
          key={nextStatus}
          disabled={isPending}
          onClick={() => changeStatus(nextStatus)}
          className={[
            "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
            style,
          ].join(" ")}
        >
          {label}
        </button>
      ))}
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
}
