/**
 * /dashboard/production — Produção do Dia
 *
 * Server Component that fetches the aggregated daily production data directly
 * from the use case (no HTTP round-trip) and passes it to the client board.
 *
 * URL filter params:
 *   ?date=YYYY-MM-DD       — target date (defaults to today)
 *   ?includes_pending=true — include PENDING orders alongside APPROVED
 */

import type { Metadata } from "next";
import { getSession } from "@/infra/http/auth/getSession";
import { getDailyProductionUseCase } from "@/infra/composition";
import { PageHeader } from "../_components/PageHeader";
import { ProductionBoardClient } from "./_components/ProductionBoardClient";
import type { DailyProductionGroup } from "@/domain/production/DailyProduction";

export const metadata: Metadata = { title: "Produção do Dia" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductionPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;

  const date =
    typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)
      ? sp.date
      : todayDateString();

  const includesPending = sp.includes_pending === "true";

  const groups: DailyProductionGroup[] =
    await getDailyProductionUseCase.execute({
      storeId: session.storeId,
      date,
      includesPending,
    });

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const totalUnits = groups.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.totalQuantity, 0),
    0,
  );
  const producedCount = groups.reduce(
    (sum, g) => sum + g.items.filter((i) => i.produced).length,
    0,
  );
  const orderIds = new Set(
    groups.flatMap((g) =>
      g.items.flatMap((i) => i.orders.map((o) => o.orderId)),
    ),
  );
  const totalOrders = orderIds.size;

  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        eyebrow="Operação"
        title="Produção do Dia"
        description={`${date} · ${totalOrders} pedido${totalOrders !== 1 ? "s" : ""} · ${totalItems} item${totalItems !== 1 ? "s" : ""} · ${totalUnits} unidade${totalUnits !== 1 ? "s" : ""}`}
      />

      <div className="p-6 md:p-8">
        <ProductionBoardClient
          groups={groups}
          storeId={session.storeId}
          date={date}
          includesPending={includesPending}
          totalItems={totalItems}
          producedCountInit={producedCount}
        />
      </div>
    </div>
  );
}
