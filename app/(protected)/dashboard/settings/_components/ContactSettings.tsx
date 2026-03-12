/**
 * ContactSettings — groups WhatsApp message templates configuration.
 *
 * Rather than embedding the full form here (which lives on its own sub-page),
 * this card provides a clear entry point with context and a direct link.
 *
 * Server Component — no interactivity.
 */

import Link from "next/link";
import { CollapsibleSettingsGroup } from "./CollapsibleSettingsGroup";

export function ContactSettings() {
  return (
    <CollapsibleSettingsGroup
      title="Mensagens"
      description="Personalize as mensagens automáticas enviadas aos clientes ao aprovar ou recusar pedidos."
      icon={<MessageIcon className="h-4 w-4" />}
    >
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Mensagens WhatsApp
            </p>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Configure os textos de confirmação e recusa de pedidos. Suporta
              variáveis dinâmicas como nome do cliente e número do pedido.
            </p>
          </div>
          <Link
            href="/dashboard/settings/messages"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors self-start sm:self-auto"
          >
            Editar mensagens
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </CollapsibleSettingsGroup>
  );
}

function MessageIcon({ className }: { className?: string }) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
