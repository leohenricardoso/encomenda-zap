import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreCatalogUseCase } from "@/infra/composition";
import { Card } from "../../../_components/Card";
import { CustomerIdentityForm } from "./_components/CustomerIdentityForm";

// ─── Route params ─────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ storeSlug: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;

  try {
    const catalog = await getStoreCatalogUseCase.execute(storeSlug);
    return {
      title: `Identificação — ${catalog.name}`,
      description: `Informe seu nome e WhatsApp para continuar o pedido em ${catalog.name}.`,
    };
  } catch {
    return { title: "Identificação" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
/**
 * /catalog/[storeSlug]/identificar
 *
 * Public page — no auth required.
 * Collects the customer's name and WhatsApp number before proceeding to
 * order review. If the store slug is unknown, falls through to the 404 page.
 *
 * Rendering: always dynamic — depends on the store slug param.
 */
export const dynamic = "force-dynamic";

export default async function IdentificarPage({ params }: Props) {
  const { storeSlug } = await params;

  // Validate that the store exists before showing the form
  const catalog = await getStoreCatalogUseCase.execute(storeSlug);
  if (!catalog) notFound();

  return (
    /*
     * Full-viewport centering — same approach as /login:
     * min-h-dvh handles mobile browser chrome (address bar) collapsing.
     */
    <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] space-y-8">
        {/* ── Store context ── */}
        <div className="flex flex-col items-center gap-4 text-center">
          <StoreBadge storeName={catalog.name} />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Quase lá!
            </h1>
            <p className="text-sm text-foreground-muted">
              Informe seus dados para&nbsp;receber o pedido pelo WhatsApp.
            </p>
          </div>
        </div>

        {/* ── Form card ── */}
        <Card>
          <CustomerIdentityForm
            storeSlug={storeSlug}
            storeName={catalog.name}
          />
        </Card>

        {/* ── Back link ── */}
        <div className="text-center">
          <a
            href={`/catalog/${storeSlug}`}
            className="text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            ← Voltar ao cardápio
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── StoreBadge ──────────────────────────────────────────────────────────────

/**
 * Store identifier shown above the card — communicates which store the
 * customer is ordering from.
 */
function StoreBadge({ storeName }: { storeName: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* WhatsApp icon container — green accent for brand recognition */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
        style={{ backgroundColor: "#25D366" }}
        aria-hidden="true"
      >
        <WhatsAppIcon className="h-6 w-6 text-white" />
      </div>

      {/* Store name */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
          Pedido em
        </p>
        <p className="text-lg font-bold tracking-tight text-foreground">
          {storeName}
        </p>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    /*
     * WhatsApp official brand icon (simplified outline glyph).
     * No external dependency — safe for server rendering.
     */
    <svg
      role="img"
      aria-label="WhatsApp"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
