import { OrderStatus } from "@/domain/order/Order";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Parsed shape of all recognised URL filter params. */
export interface ParsedFilters {
  from: string | null;
  to: string | null;
  status: OrderStatus | null;
}

/** Extended parsed shape for the orders listing page. */
export interface ParsedOrdersFilters extends ParsedFilters {
  /** Free-text customer search (name or phone). */
  search: string | null;
  /** Current page number (1-based). */
  page: number;
  /** Number of rows per page: 10, 25, or 50. */
  limit: number;
}

// ─── parseFilters ─────────────────────────────────────────────────────────────

/**
 * Reads filter values from a plain params record (works on both server and
 * client — no Next.js or browser dependencies).
 *
 * Called from:
 *   • DashboardPage (Server Component) — via `await searchParams`
 *   • FilterBar      (Client Component) — via `useSearchParams()`
 */
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): ParsedFilters {
  const raw = (k: string): string | null => {
    const v = params[k];
    return typeof v === "string" ? v : null;
  };

  const rawStatus = raw("status");
  const validStatuses = Object.values(OrderStatus) as string[];

  return {
    from: raw("from"),
    to: raw("to"),
    status:
      rawStatus && validStatuses.includes(rawStatus)
        ? (rawStatus as OrderStatus)
        : null,
  };
}

// ─── parseOrdersFilters ───────────────────────────────────────────────────────

/**
 * Extended filter parser for the orders listing page.
 * Adds customer text search, page, and limit on top of the base filters.
 */
export function parseOrdersFilters(
  params: Record<string, string | string[] | undefined>,
): ParsedOrdersFilters {
  const base = parseFilters(params);
  const raw = (k: string): string | null => {
    const v = params[k];
    return typeof v === "string" ? v : null;
  };

  const rawPage = parseInt(raw("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const rawLimit = parseInt(raw("limit") ?? "25", 10);
  const limit = [10, 25, 50].includes(rawLimit) ? rawLimit : 25;

  return {
    ...base,
    search: raw("search") ?? null,
    page,
    limit,
  };
}
