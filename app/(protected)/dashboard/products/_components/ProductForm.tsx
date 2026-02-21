"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type PricingType = "UNIT" | "WEIGHT";

interface VariantRow {
  label: string;
  price: string;
  pricingType: PricingType;
  isActive: boolean;
}

interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  minQuantity: string;
  isActive: boolean;
}

interface Props {
  /** Defined → edit mode (PUT /api/products/:productId). Undefined → create mode (POST /api/products). */
  productId?: string;
  initialValues?: Partial<ProductFormValues & { variants?: VariantRow[] }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  minQuantity: "1",
  isActive: true,
};

const EMPTY_VARIANT: VariantRow = {
  label: "",
  price: "",
  pricingType: "UNIT",
  isActive: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductForm({ productId, initialValues }: Props) {
  const router = useRouter();
  const isEditMode = productId !== undefined;

  const [values, setValues] = useState<ProductFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  const [variants, setVariants] = useState<VariantRow[]>(
    initialValues?.variants ?? [],
  );

  const hasVariants = variants.length > 0;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!values.name.trim()) {
      next.name = "Nome é obrigatório.";
    } else if (values.name.trim().length < 2) {
      next.name = "Nome deve ter pelo menos 2 caracteres.";
    }

    if (!hasVariants) {
      const priceNum = parseFloat(values.price.replace(",", "."));
      if (!values.price.trim()) {
        next.price = "Preço é obrigatório quando não há variações.";
      } else if (isNaN(priceNum) || priceNum <= 0) {
        next.price = "Preço deve ser maior que zero.";
      }
    }

    const minQty = parseInt(values.minQuantity, 10);
    if (isNaN(minQty) || minQty < 1) {
      next.minQuantity = "Quantidade mínima deve ser pelo menos 1.";
    }

    variants.forEach((v, i) => {
      if (!v.label.trim()) next[`variant_${i}_label`] = "Rótulo obrigatório.";
      const vPrice = parseFloat(v.price.replace(",", "."));
      if (!v.price.trim() || isNaN(vPrice) || vPrice <= 0)
        next[`variant_${i}_price`] = "Preço deve ser maior que zero.";
    });

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
    setErrors((prev) => ({ ...prev, [name]: undefined as unknown as string }));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant<K extends keyof VariantRow>(
    index: number,
    field: K,
    value: VariantRow[K],
  ) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    const body: Record<string, unknown> = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      isActive: values.isActive,
      minQuantity: parseInt(values.minQuantity, 10),
    };

    if (hasVariants) {
      body.variants = variants.map((v, i) => ({
        label: v.label.trim(),
        price: parseFloat(v.price.replace(",", ".")),
        pricingType: v.pricingType,
        isActive: v.isActive,
        sortOrder: i,
      }));
      // In edit mode, explicitly clear the fixed price when switching to variants
      if (isEditMode) body.price = null;
    } else {
      body.price = parseFloat(values.price.replace(",", "."));
      // In edit mode, send empty variants array to remove all existing variants
      if (isEditMode) body.variants = [];
    }

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
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-lg">
      {/* Server error */}
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

      {/* Fixed price — hidden when variants are present */}
      {!hasVariants && (
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
      )}

      {/* Min quantity */}
      <div>
        <label
          htmlFor="minQuantity"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Quantidade mínima
        </label>
        <input
          id="minQuantity"
          name="minQuantity"
          type="number"
          min={1}
          step={1}
          value={values.minQuantity}
          onChange={handleChange}
          className={`w-32 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.minQuantity ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.minQuantity && (
          <p className="mt-1 text-xs text-red-600">{errors.minQuantity}</p>
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

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-medium text-gray-700">Variações</span>
            <span className="ml-1.5 text-xs text-gray-400">(opcional)</span>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="rounded-md border border-indigo-300 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            + Adicionar variação
          </button>
        </div>

        {variants.length === 0 && (
          <p className="text-xs text-gray-400 italic">
            Sem variações — o produto usa preço fixo.
          </p>
        )}

        <div className="space-y-4">
          {variants.map((variant, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Variação {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-xs text-red-500 hover:text-red-700 focus:outline-none"
                >
                  Remover
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Rótulo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={variant.label}
                  onChange={(e) => updateVariant(i, "label", e.target.value)}
                  placeholder="Ex: Pequeno, 500g, Com recheio…"
                  className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors[`variant_${i}_label`]
                      ? "border-red-400"
                      : "border-gray-300"
                  }`}
                />
                {errors[`variant_${i}_label`] && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors[`variant_${i}_label`]}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preço (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={variant.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                    placeholder="Ex: 15.90"
                    className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors[`variant_${i}_price`]
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  {errors[`variant_${i}_price`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`variant_${i}_price`]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tipo de preço
                  </label>
                  <select
                    value={variant.pricingType}
                    onChange={(e) =>
                      updateVariant(
                        i,
                        "pricingType",
                        e.target.value as PricingType,
                      )
                    }
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="UNIT">Por unidade</option>
                    <option value="WEIGHT">Por peso</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`variant_${i}_isActive`}
                  checked={variant.isActive}
                  onChange={(e) =>
                    updateVariant(i, "isActive", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`variant_${i}_isActive`}
                  className="text-xs font-medium text-gray-600"
                >
                  Variação ativa
                </label>
              </div>
            </div>
          ))}
        </div>
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
