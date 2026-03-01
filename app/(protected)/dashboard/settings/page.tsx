/**
 * /dashboard/settings — Store settings page (Server Component).
 *
 * Loads all configured CEP ranges from the DB so the form can be pre-filled,
 * then hands off to a Client Component for all interactivity.
 */

import Link from "next/link";
import { getSession } from "@/infra/http/auth/getSession";
import { getCepRangeUseCase } from "@/infra/composition";
import { CepRangeForm } from "./_components/CepRangeForm";

export default async function SettingsPage() {
  const session = await getSession();

  // Load existing CEP ranges (empty array = unrestricted delivery)
  const ranges = await getCepRangeUseCase.execute(session.storeId);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-xl space-y-8">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Configurações
          </h1>
          <p className="text-sm text-foreground-muted">
            Ajuste as configurações da sua loja.
          </p>
        </div>

        {/* ── CEP range form ──────────────────────────────────────────────── */}
        <CepRangeForm
          initialRanges={ranges.map((r) => ({
            id: r.id,
            cepStart: r.cepStart,
            cepEnd: r.cepEnd,
          }))}
        />

        {/* ── WhatsApp messages ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-line bg-surface p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h2 className="font-semibold text-foreground">
              Mensagens WhatsApp
            </h2>
            <p className="text-sm text-foreground-muted">
              Configure as mensagens enviadas ao aprovar ou recusar pedidos.
            </p>
          </div>
          <Link
            href="/dashboard/settings/messages"
            className="shrink-0 rounded-lg border border-line px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors self-start sm:self-auto"
          >
            Configurar
          </Link>
        </div>
      </div>
    </main>
  );
}
