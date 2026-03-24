"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type {
  DailyProductionGroup,
  DailyProductionItem,
} from "@/domain/production/DailyProduction";
import { CategorySection } from "./CategorySection";
import { OrdersDrawer } from "./OrdersDrawer";
import { ProductionProgressBar } from "./ProductionProgressBar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductionBoardClientProps {
  groups: DailyProductionGroup[];
  storeId: string;
  date: string;
  includesPending: boolean;
  totalItems: number;
  producedCountInit: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductionBoardClient({
  groups,
  storeId,
  date,
  includesPending,
  totalItems,
  producedCountInit,
}: ProductionBoardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Local state ───────────────────────────────────────────────────────────
  const [producedKeys, setProducedKeys] = useState<Set<string>>(
    () =>
      new Set(
        groups
          .flatMap((g) => g.items)
          .filter((i) => i.produced)
          .map((i) => i.itemKey),
      ),
  );
  const [drawerItem, setDrawerItem] = useState<DailyProductionItem | null>(
    null,
  );
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const producedCount = producedKeys.size;

  // ── Date navigation ───────────────────────────────────────────────────────
  function navigateToDate(newDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", newDate);
    router.push(`${pathname}?${params.toString()}`);
  }

  function todayString() {
    return new Date().toISOString().slice(0, 10);
  }

  function tomorrowString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function formatDateLabel(d: string) {
    return new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }

  // ── Pending toggle ────────────────────────────────────────────────────────
  function togglePending() {
    const params = new URLSearchParams(searchParams.toString());
    if (includesPending) {
      params.delete("includes_pending");
    } else {
      params.set("includes_pending", "true");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // ── Checklist toggle ──────────────────────────────────────────────────────
  const handleToggle = useCallback(
    async (itemKey: string) => {
      // Optimistic update
      setProducedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(itemKey)) {
          next.delete(itemKey);
        } else {
          next.add(itemKey);
        }
        return next;
      });
      setLoadingKey(itemKey);

      try {
        const res = await fetch("/api/production/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, itemKey }),
        });

        if (!res.ok) {
          // Revert optimistic update on failure
          setProducedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(itemKey)) {
              next.delete(itemKey);
            } else {
              next.add(itemKey);
            }
            return next;
          });
          return;
        }

        const body = (await res.json()) as {
          success: boolean;
          data?: { produced: boolean };
        };

        if (body.success && body.data !== undefined) {
          // Sync with server truth
          setProducedKeys((prev) => {
            const next = new Set(prev);
            if (body.data!.produced) {
              next.add(itemKey);
            } else {
              next.delete(itemKey);
            }
            return next;
          });
        }
      } catch {
        // Network error — revert
        setProducedKeys((prev) => {
          const next = new Set(prev);
          if (next.has(itemKey)) {
            next.delete(itemKey);
          } else {
            next.add(itemKey);
          }
          return next;
        });
      } finally {
        setLoadingKey(null);
      }
    },
    [date],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const today = todayString();
  const tomorrow = tomorrowString();

  return (
    <>
      {/* ── Controls bar ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        {/* Date navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigateToDate(today)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              date === today
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => navigateToDate(tomorrow)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              date === tomorrow
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            Amanhã
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) navigateToDate(e.target.value);
            }}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          <span className="text-sm text-muted capitalize">
            {formatDateLabel(date)}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePending}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              includesPending
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-line bg-surface text-foreground hover:border-line"
            }`}
          >
            {includesPending ? "Incluindo pendentes" : "Incluir pendentes"}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      {totalItems > 0 && (
        <div className="mb-6">
          <ProductionProgressBar produced={producedCount} total={totalItems} />
        </div>
      )}

      {/* ── Print header ──────────────────────────────────────────────────── */}
      <div className="hidden print:block mb-6">
        <h2 className="text-lg font-semibold">
          Produção do Dia — {formatDateLabel(date)}
        </h2>
        <p className="text-sm text-gray-500">
          {producedCount}/{totalItems} itens produzidos
        </p>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-12 text-center">
          <p className="text-base font-medium text-foreground">
            Nenhum pedido para esta data
          </p>
          <p className="mt-1 text-sm text-muted">
            {includesPending
              ? "Não há pedidos aprovados ou pendentes para este dia."
              : "Não há pedidos aprovados para este dia. Tente incluir os pendentes."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <CategorySection
              key={group.categoryName}
              group={group}
              producedKeys={producedKeys}
              loadingKey={loadingKey}
              onToggle={handleToggle}
              onViewOrders={setDrawerItem}
            />
          ))}
        </div>
      )}

      {/* ── Orders drawer ─────────────────────────────────────────────────── */}
      <OrdersDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </>
  );
}
