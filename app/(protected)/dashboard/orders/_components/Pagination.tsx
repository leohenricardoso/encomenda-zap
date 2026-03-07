"use client";

import { useRouter, useSearchParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
}

const LIMIT_OPTIONS = [10, 25, 50];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pagination — page navigation and rows-per-page selector.
 *
 * Syncs with URL search params (`page` and `limit`).
 * Designed to live alongside the orders table.
 */
export function Pagination({ page, limit, total }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  function push(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === "1" && k === "page") next.delete("page");
      else next.set(k, v);
    }
    router.push(`?${next.toString()}`, { scroll: false });
  }

  function goPage(p: number) {
    push({ page: String(p) });
  }

  function changeLimit(l: number) {
    // Reset to page 1 whenever limit changes
    push({ limit: String(l), page: "1" });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground-muted">
      {/* ── Info ─────────────────────────────────────────────────────────── */}
      <p className="shrink-0">
        {total === 0 ? (
          "Nenhum resultado"
        ) : (
          <>
            Exibindo{" "}
            <span className="font-medium text-foreground tabular-nums">
              {from}–{to}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground tabular-nums">
              {total}
            </span>{" "}
            pedidos
          </>
        )}
      </p>

      <div className="flex items-center gap-3">
        {/* ── Rows per page ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="orders-limit"
            className="text-xs text-foreground-muted"
          >
            Por página:
          </label>
          <select
            id="orders-limit"
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className={[
              "h-8 cursor-pointer rounded-lg border border-line bg-surface",
              "px-2 text-sm text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-accent/40",
            ].join(" ")}
          >
            {LIMIT_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* ── Nav buttons ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1">
          <NavButton
            onClick={() => goPage(1)}
            disabled={page <= 1}
            aria-label="Primeira página"
          >
            «
          </NavButton>
          <NavButton
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            ‹
          </NavButton>

          <span className="px-2 text-xs tabular-nums">
            {page} / {totalPages}
          </span>

          <NavButton
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Próxima página"
          >
            ›
          </NavButton>
          <NavButton
            onClick={() => goPage(totalPages)}
            disabled={page >= totalPages}
            aria-label="Última página"
          >
            »
          </NavButton>
        </div>
      </div>
    </div>
  );
}

// ─── NavButton atom ───────────────────────────────────────────────────────────

function NavButton({
  children,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40",
        disabled
          ? "cursor-not-allowed border-line bg-surface text-foreground-muted/40"
          : "cursor-pointer border-line bg-surface text-foreground hover:bg-surface-hover",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
