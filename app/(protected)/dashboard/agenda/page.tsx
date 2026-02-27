/**
 * /dashboard/agenda — Store schedule configuration page (Server Component).
 *
 * Loads the current month's schedule from the DB and passes it to the
 * interactive calendar client component.
 */

import { getSession } from "@/infra/http/auth/getSession";
import {
  getStoreScheduleUseCase,
  listPickupSlotsUseCase,
} from "@/infra/composition";
import { AgendaCalendar } from "./_components/AgendaCalendar";
import { PickupSlotsPanel } from "./_components/PickupSlotsPanel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function lastDayOfMonth(year: number, month: number): string {
  // month + 1 with day 0 = last day of `month`
  const last = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgendaPage() {
  const session = await getSession();

  // Use UTC-based month to avoid timezone surprises
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-based

  const [{ days }, { slots }] = await Promise.all([
    getStoreScheduleUseCase.execute({
      storeId: session.storeId,
      from: firstDayOfMonth(year, month),
      to: lastDayOfMonth(year, month),
    }),
    listPickupSlotsUseCase.execute({
      storeId: session.storeId,
      activeOnly: false,
    }),
  ]);

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Agenda
          </h1>
          <p className="text-sm text-foreground-muted">
            Clique em um dia para abrir ou fechar encomendas. Segunda a sexta
            são abertos por padrão.
          </p>
        </div>

        {/* ── Calendar ────────────────────────────────────────────────────── */}
        <AgendaCalendar
          initialDays={days}
          initialYear={year}
          initialMonth={month}
        />

        {/* ── Pickup slots ────────────────────────────────────────────────── */}
        <PickupSlotsPanel initialSlots={slots} />
      </div>
    </div>
  );
}
