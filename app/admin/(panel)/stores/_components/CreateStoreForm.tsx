"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CreateStoreForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body: Record<string, string> = { name, whatsapp };
      if (adminEmail) {
        body.adminEmail = adminEmail;
        body.adminPassword = adminPassword;
      }

      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? "Erro ao criar loja.");
        return;
      }
      if (data.id) {
        router.push(`/admin/stores/${data.id}`);
      } else {
        router.push("/admin/stores");
      }
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

      <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <legend className="px-1 text-sm font-semibold text-slate-700">
          Dados da loja
        </legend>

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
            placeholder="Ex: Doces da Maria"
          />
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
            placeholder="55119999988888"
          />
          <p className="text-xs text-slate-400">
            Somente dígitos, incluindo DDI (55…)
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <legend className="px-1 text-sm font-semibold text-slate-700">
          Conta do administrador{" "}
          <span className="text-xs font-normal text-slate-400">(opcional)</span>
        </legend>

        <div className="space-y-1">
          <label
            htmlFor="adminEmail"
            className="block text-sm font-medium text-slate-700"
          >
            E-mail
          </label>
          <input
            id="adminEmail"
            type="email"
            maxLength={254}
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            placeholder="dono@loja.com"
          />
        </div>

        {adminEmail && (
          <div className="space-y-1">
            <label
              htmlFor="adminPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Senha <span className="text-red-500">*</span>
            </label>
            <input
              id="adminPassword"
              type="password"
              maxLength={128}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        )}
      </fieldset>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-linear-to-r from-blue-600 to-blue-500 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 transition-all"
        >
          {loading ? "Criando…" : "Criar loja"}
        </button>
      </div>
    </form>
  );
}
