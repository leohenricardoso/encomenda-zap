import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getStoreCatalogUseCase,
  getStoreScheduleUseCase,
} from "@/infra/composition";
import { DatePickerClient } from "./_components/DatePickerClient";
import type { ScheduleDay } from "@/domain/schedule/StoreSchedule";

// ─── Route params ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ storeSlug: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tomorrowUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;
  try {
    const catalog = await getStoreCatalogUseCase.execute(storeSlug);
    return {
      title: `Escolha a data — ${catalog.name}`,
      description: `Selecione a data de entrega do seu pedido em ${catalog.name}.`,
      robots: { index: false },
    };
  } catch {
    return { title: "Escolha a data" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * /catalog/[storeSlug]/pedido/data
 *
 * Public page — no auth required.
 *
 * Runs entirely on the server:
 * 1. Resolves storeSlug → storeId (via catalog use case).
 * 2. Fetches availability for the next 30 days.
 * 3. Passes the pre-serialised schedule to the client component.
 *
 * Only open, editable days are passed to the client — the server already
 * filters out closed and past dates so the client receives a clean list.
 */
export const dynamic = "force-dynamic";

export default async function EscolherDataPage({ params }: Props) {
  const { storeSlug } = await params;

  // 1. Validate store + get storeId
  let catalog;
  try {
    catalog = await getStoreCatalogUseCase.execute(storeSlug);
  } catch {
    notFound();
  }

  const from = tomorrowUtc();
  const to = addDays(from, 29); // 30-day window

  // 2. Fetch schedule — falls back gracefully if service throws
  let days: ScheduleDay[] = [];
  try {
    const result = await getStoreScheduleUseCase.execute({
      storeId: catalog.storeId,
      from,
      to,
    });
    // Only pass editable days to the client (past dates are excluded)
    days = result.days.filter((d) => d.isEditable);
  } catch {
    days = [];
  }

  return (
    <DatePickerClient
      storeSlug={storeSlug}
      storeName={catalog.name}
      days={days.map((d) => ({ date: d.date, isOpen: d.isOpen }))}
    />
  );
}
