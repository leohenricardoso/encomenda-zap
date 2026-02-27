import { OrderStatus } from "@/domain/order/Order";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Parsed shape of all recognised URL filter params. */
export interface ParsedFilters {
  from: string | null;
  to: string | null;
  status: OrderStatus | null;
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
