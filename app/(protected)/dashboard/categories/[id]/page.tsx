/**
 * /dashboard/categories/[id] — Server Component.
 * Displays category info form + product list with drag-and-drop reordering.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/infra/http/auth/getSession";
import {
  listCategoriesUseCase,
  listProductsUseCase,
} from "@/infra/composition";
import { PageHeader } from "../../_components/PageHeader";
import { CategoryInfoForm } from "../_components/CategoryInfoForm";
import { SortableProductList } from "../_components/SortableProductList";
import { AddProductModal } from "../_components/AddProductModal";

export const metadata: Metadata = { title: "Editar Categoria" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  const [categories, allProducts] = await Promise.all([
    listCategoriesUseCase.execute(session.storeId),
    listProductsUseCase.execute(session.storeId),
  ]);

  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        eyebrow="Categorias"
        title={category.name}
        actions={
          <Link
            href="/dashboard/categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm text-foreground-muted hover:bg-surface-subtle transition-colors"
          >
            ← Voltar
          </Link>
        }
      />

      <div className="p-6 md:p-8 flex flex-col gap-8 max-w-2xl">
        {/* Category meta (name, isActive) */}
        <CategoryInfoForm category={category} />

        {/* Product list with drag-and-drop reordering */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Produtos nesta categoria
            </h2>
            <AddProductModal
              categoryId={id}
              storeId={session.storeId}
              allProducts={allProducts}
            />
          </div>
          <SortableProductList categoryId={id} storeId={session.storeId} />
        </section>
      </div>
    </div>
  );
}
