"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  isActive: boolean;
}

interface Props {
  /** Defined → edit mode (PUT /api/products/:productId). Undefined → create mode (POST /api/products). */
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
}

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  isActive: true,
};

export function ProductForm({ productId, initialValues }: Props) {
  const router = useRouter();
  const isEditMode = productId !== undefined;

  const [values, setValues] = useState<ProductFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormValues, string>>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: typeof errors = {};

    if (!values.name.trim()) {
      next.name = "Nome é obrigatório.";
    } else if (values.name.trim().length < 2) {
      next.name = "Nome deve ter pelo menos 2 caracteres.";
    }

    const priceNum = parseFloat(values.price.replace(",", "."));
    if (!values.price.trim()) {
      next.price = "Preço é obrigatório.";
    } else if (isNaN(priceNum) || priceNum < 0) {
      next.price = "Preço deve ser um número não negativo.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    const price = parseFloat(values.price.replace(",", "."));
    const body = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      price,
      isActive: values.isActive,
    };

    setLoading(true);
    try {
      const url = isEditMode ? `/api/products/${productId}` : "/api/products";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError(json?.error ?? "Ocorreu um erro. Tente novamente.");
        return;
      }

      router.push("/dashboard/products");
      router.refresh();
    } catch {
      setServerError(
        "Falha de conexão. Verifique sua internet e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ─── UI ────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-lg">
      {/* Server error banner */}
      {serverError && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nome{" "}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          required
          value={values.name}
          onChange={handleChange}
          placeholder="Ex: Bolo de chocolate"
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.name ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Descrição <span className="text-gray-400 text-xs">(opcional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={values.description}
          onChange={handleChange}
          placeholder="Detalhes do produto, ingredientes, tamanhos…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Preço (R$){" "}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        <input
          id="price"
          name="price"
          type="text"
          inputMode="decimal"
          required
          value={values.price}
          onChange={handleChange}
          placeholder="Ex: 29.90"
          className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.price ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.price && (
          <p className="mt-1 text-xs text-red-600">{errors.price}</p>
        )}
      </div>

      {/* Is Active */}
      <div className="flex items-center gap-3">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          checked={values.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Produto ativo (visível no cardápio)
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? "Salvando…"
            : isEditMode
              ? "Salvar alterações"
              : "Criar produto"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
