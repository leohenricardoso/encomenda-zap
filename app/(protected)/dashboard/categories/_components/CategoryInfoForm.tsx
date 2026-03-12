"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CategorySummary } from "@/domain/category/Category";

interface Props {
  category: CategorySummary;
}

export function CategoryInfoForm({ category }: Props) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [isActive, setIsActive] = useState(category.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ?? "Erro ao atualizar.",
        );
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Informações
      </h2>
      <form
        id="category-info-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Salvo com sucesso.
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cat-name"
            className="text-sm font-medium text-foreground"
          >
            Nome
          </label>
          <input
            id="cat-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground-muted">
            Slug
          </span>
          <span className="font-mono text-xs text-foreground-muted">
            {category.slug}
          </span>
          <span className="text-xs text-foreground-muted">
            O slug é atualizado automaticamente ao salvar o nome.
          </span>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          <span className="text-sm text-foreground">Categoria ativa</span>
        </label>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-fit rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando..." : "Salvar informações"}
        </button>
      </form>
    </section>
  );
}
