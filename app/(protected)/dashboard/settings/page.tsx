/**
 * /dashboard/settings — Store settings page (Server Component).
 *
 * Loads all configured CEP ranges from the DB so the form can be pre-filled,
 * then hands off to a Client Component for all interactivity.
 */

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
      </div>
    </main>
  );
}
