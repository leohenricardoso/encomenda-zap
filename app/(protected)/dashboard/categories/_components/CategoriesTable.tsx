"use client";

import Link from "next/link";
import { useState } from "react";
import type { CategorySummary } from "@/domain/category/Category";

interface Props {
  categories: CategorySummary[];
}

export function CategoriesTable({ categories }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState(categories);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ?? "Erro ao excluir.",
        );
      }
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setDeleting(null);
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-12 text-center">
        <p className="text-foreground-muted text-sm">
          Nenhuma categoria criada ainda.
        </p>
        <Link
          href="/dashboard/categories/new"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:--f transition-colors"
        >
          Criar primeira categoria
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                Nome
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                Slug
              </th>
              <th className="px-4 py-3 text-center font-medium text-foreground-muted">
                Produtos
              </th>
              <th className="px-4 py-3 text-center font-medium text-foreground-muted">
                Ativo
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((cat) => (
              <tr
                key={cat.id}
                className="hover:bg-surface-subtle transition-colors"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {cat.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                  {cat.slug}
                </td>
                <td className="px-4 py-3 text-center text-foreground-muted">
                  {cat.productCount}
                </td>
                <td className="px-4 py-3 text-center">
                  {cat.isActive ? (
                    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-foreground-muted">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/categories/${cat.id}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleting === cat.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {deleting === cat.id ? "..." : "Excluir"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
