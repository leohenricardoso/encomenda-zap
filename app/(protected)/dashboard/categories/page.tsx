/**
 * /dashboard/categories — Server Component.
 * Lists all categories for the logged-in store.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/infra/http/auth/getSession";
import { listCategoriesUseCase } from "@/infra/composition";
import { PageHeader } from "../_components/PageHeader";
import { SortableCategoriesList } from "./_components/SortableCategoriesList";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const session = await getSession();
  const categories = await listCategoriesUseCase.execute(session.storeId);

  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        eyebrow="Catálogo"
        title="Categorias"
        description="Organize seus produtos em categorias para facilitar a navegação."
        actions={
          <Link
            href="/dashboard/categories/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova categoria
          </Link>
        }
      />

      <div className="p-6 md:p-8">
        <SortableCategoriesList categories={categories} />
      </div>
    </div>
  );
}
