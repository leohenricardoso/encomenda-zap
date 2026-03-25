"use client";

import { useState } from "react";
import type {
  DailyProductionGroup,
  DailyProductionItem,
} from "@/domain/production/DailyProduction";
import { ProductionCard } from "./ProductionCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategorySectionProps {
  group: DailyProductionGroup;
  producedKeys: Set<string>;
  loadingKey: string | null;
  onToggle: (itemKey: string) => void;
  onViewOrders: (item: DailyProductionItem) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategorySection({
  group,
  producedKeys,
  loadingKey,
  onToggle,
  onViewOrders,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const totalUnits = group.items.reduce((sum, i) => sum + i.totalQuantity, 0);
  const producedItems = group.items.filter((i) =>
    producedKeys.has(i.itemKey),
  ).length;
  const allProduced = producedItems === group.items.length;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface print:border-gray-300">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-hover transition-colors print:pointer-events-none"
      >
        <div className="flex items-center gap-3">
          {/* Accordion chevron */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`h-4 w-4 shrink-0 text-muted transition-transform print:hidden ${isOpen ? "rotate-90" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>

          <span className="font-semibold text-foreground">
            {group.categoryName}
          </span>

          {/* Progress badge */}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              allProduced
                ? "bg-green-100 text-green-700"
                : "bg-surface-raised text-muted"
            }`}
          >
            {producedItems}/{group.items.length}
          </span>
        </div>

        {/* Right: total units */}
        <span className="shrink-0 text-sm text-muted">
          {totalUnits} unidade{totalUnits !== 1 ? "s" : ""}
        </span>
      </button>

      {/* ── Items ───────────────────────────────────────────────────────── */}
      {(isOpen || true) && (
        <div
          className={`border-t border-line divide-y divide-line print:block ${isOpen ? "block" : "hidden"} print:block!`}
        >
          {group.items.map((item) => (
            <ProductionCard
              key={item.itemKey}
              item={item}
              produced={producedKeys.has(item.itemKey)}
              isLoading={loadingKey === item.itemKey}
              onToggle={() => onToggle(item.itemKey)}
              onViewOrders={() => onViewOrders(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
