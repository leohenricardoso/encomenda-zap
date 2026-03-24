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
    <div className="flex items-center gap-4">
      {/* Bar */}
      <div className="flex-1 overflow-hidden rounded-full bg-surface-raised h-2.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            allDone ? "bg-green-500" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Label */}
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          allDone ? "text-green-600" : "text-foreground"
        }`}
      >
        {produced}/{total}
        <span className="ml-1 font-normal text-muted">
          ({pct}%)
          {allDone && " ✓"}
        </span>
      </span>
    </div>
  );
}
