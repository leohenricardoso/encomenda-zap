import { formatWhatsApp, whatsAppUrl } from "./helpers";

// ─── Component ────────────────────────────────────────────────────────────────

interface CustomerInfoCardProps {
  name: string;
  /** Normalised digits-only WhatsApp, e.g. "5511999998888". */
  whatsapp: string;
  orderNumber?: number | null;
  /**
   * Pre-computed wa.me URL. When provided, overrides the default URL built
   * from whatsAppUrl().
   */
  waUrl?: string;
}

/**
 * CustomerInfoCard — customer name, phone and WhatsApp CTA.
 *
 * Shows a two-letter initials avatar, the customer name, formatted phone
 * and a WhatsApp direct-message button.
 */
export function CustomerInfoCard({
  name,
  whatsapp,
  orderNumber,
  waUrl: waUrlOverride,
}: CustomerInfoCardProps) {
  const formatted = formatWhatsApp(whatsapp);
  const waUrl = waUrlOverride ?? whatsAppUrl(whatsapp, name, orderNumber);

  // Two-letter initials: first + last word initial
  const words = name.trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  return (
    <section aria-label="Cliente">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
        <span className="h-3.5 w-3.5 shrink-0">
          <PersonIcon />
        </span>
        Cliente
      </h2>

      <div className="mt-3 rounded-xl border border-line bg-surface p-4 flex flex-col gap-4">
        {/* Identity row */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/8 text-sm font-bold text-foreground select-none">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm leading-snug truncate">
              {name}
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">{formatted}</p>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1ebe5d] transition-colors"
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          Abrir no WhatsApp
        </a>
      </div>
    </section>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.523 5.843L.057 23.57a.5.5 0 0 0 .608.61l5.882-1.539A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.697 9.697 0 0 1-5.018-1.395l-.36-.215-3.73.977.993-3.63-.234-.374A9.71 9.71 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}
