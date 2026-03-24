// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductionProgressBarProps {
  produced: number;
  total: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductionProgressBar({
  produced,
  total,
}: ProductionProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((produced / total) * 100);
  const allDone = produced === total && total > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Header row: label + percentage */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Progresso da produção do dia
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            allDone ? "text-green-600" : "text-accent"
          }`}
        >
          {pct}% concluído{allDone && " ✓"}
        </span>
      </div>

      {/* Bar */}
      <div className="overflow-hidden rounded-full bg-[#dddddd] h-3 border-2 border-black/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            allDone ? "bg-green-500" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Sub-label: N/M items */}
      <span className="text-xs text-muted tabular-nums">
        {produced} de {total} ite{total !== 1 ? "ns" : "m"} produzido
        {total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
