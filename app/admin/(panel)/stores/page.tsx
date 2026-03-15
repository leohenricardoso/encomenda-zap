import Link from "next/link";
import type { Metadata } from "next";
import { listAllStoresUseCase } from "@/infra/composition";
import { StoreStatusBadge } from "./_components/StoreStatusBadge";
import { StoreRowActions } from "./_components/StoreRowActions";

export const metadata: Metadata = {
  title: "Lojas — Super Admin",
};

// Dynamic — always fetches fresh data
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function StoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const { stores, total, limit } = await listAllStoresUseCase.execute({
    status: params.status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined,
    search: params.search,
    page,
    limit: 20,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lojas</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} loja{total !== 1 ? "s" : ""} na plataforma
          </p>
        </div>
        <Link
          href="/admin/stores/new"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-600 transition-all"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nova loja
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Buscar por nome…"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativas</option>
          <option value="INACTIVE">Inativas</option>
          <option value="SUSPENDED">Suspensas</option>
        </select>
        <button
          type="submit"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Filtrar
        </button>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg
                className="size-7 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-900">
              Nenhuma loja encontrada
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ajuste os filtros ou crie uma nova loja.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Loja
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Slug
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Admin
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Criada em
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((store) => (
                <tr
                  key={store.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/stores/${store.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {store.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {store.slug ? (
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {store.slug}
                      </code>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {store.adminEmail ?? (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StoreStatusBadge status={store.status} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(store.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Editar
                      </Link>
                      <StoreRowActions
                        storeId={store.id}
                        currentStatus={store.status}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}${params.status ? `&status=${params.status}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
