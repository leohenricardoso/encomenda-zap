"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { StoreWithDetails } from "@/domain/store/types";

interface EditStoreFormProps {
  store: StoreWithDetails;
}

export function EditStoreForm({ store }: EditStoreFormProps) {
  const router = useRouter();
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug ?? "");
  const [whatsapp, setWhatsapp] = useState(store.whatsapp);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined, whatsapp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Erro ao salvar alterações.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <span>Alterações salvas com sucesso.</span>
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700"
        >
          Nome da loja <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-slate-700"
        >
          Slug
        </label>
        <input
          id="slug"
          type="text"
          maxLength={100}
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          placeholder="minha-loja"
        />
        <p className="text-xs text-slate-400">
          URL do catálogo: /catalog/{slug || "slug-da-loja"}
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="whatsapp"
          className="block text-sm font-medium text-slate-700"
        >
          WhatsApp <span className="text-red-500">*</span>
        </label>
        <input
          id="whatsapp"
          type="tel"
          required
          maxLength={20}
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-linear-to-r from-blue-600 to-blue-500 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 transition-all"
        >
          {loading ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
