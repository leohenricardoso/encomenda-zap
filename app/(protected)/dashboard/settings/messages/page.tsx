/**
 * /dashboard/settings/messages — WhatsApp message templates (Server Component).
 *
 * Loads existing config and hands off to the <MessagesForm> client component.
 */

import Link from "next/link";
import { getSession } from "@/infra/http/auth/getSession";
import { getStoreMessagesUseCase } from "@/infra/composition";
import { MessagesForm } from "./_components/MessagesForm";

export default async function MessagesSettingsPage() {
  const session = await getSession();
  const config = await getStoreMessagesUseCase.execute(session.storeId);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-xl space-y-8">
        {/* ── Back link + header ────────────────────────────────────────── */}
        <div className="space-y-1">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Configurações
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Mensagens WhatsApp
          </h1>
          <p className="text-sm text-foreground-muted">
            Configure as mensagens padrão enviadas aos clientes ao aprovar ou
            recusar pedidos.
          </p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <MessagesForm
          initialApproval={config?.approvalMessage ?? null}
          initialRejection={config?.rejectionMessage ?? null}
        />
      </div>
    </main>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
