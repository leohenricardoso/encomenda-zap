import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getStoreDetailUseCase } from "@/infra/composition";
import { StoreStatusBadge } from "../_components/StoreStatusBadge";
import { StoreRowActions } from "../_components/StoreRowActions";
import { EditStoreForm } from "../_components/EditStoreForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const store = await getStoreDetailUseCase.execute(id);
    return { title: `${store.name} — Super Admin` };
  } catch {
    return { title: "Loja — Super Admin" };
  }
}

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: PageProps) {
  const { id } = await params;

  let store;
  try {
    store = await getStoreDetailUseCase.execute(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/admin/stores"
          className="hover:text-slate-900 transition-colors"
        >
          Lojas
        </Link>
        <svg
          className="size-4 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="font-medium text-slate-900">{store.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{store.name}</h1>
            <StoreStatusBadge status={store.status} />
          </div>
          <div className="mt-1.5 flex items-center gap-4 text-sm text-slate-500">
            {store.slug && (
              <span>
                Slug:{" "}
                <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {store.slug}
                </code>
              </span>
            )}
            {store.adminEmail && <span>Admin: {store.adminEmail}</span>}
            <span>
              Criada em {new Date(store.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      {/* Status panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Status da loja
        </h2>
        <div className="flex items-center gap-4">
          <StoreStatusBadge status={store.status} />
          <StoreRowActions storeId={store.id} currentStatus={store.status} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Alterar o status afeta imediatamente a visibilidade do catálogo
          público.
        </p>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-slate-900">
          Informações da loja
        </h2>
        <EditStoreForm store={store} />
      </div>
    </div>
  );
}
