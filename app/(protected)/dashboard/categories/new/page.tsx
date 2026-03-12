/**
 * /dashboard/categories/new — Server Component shell.
 * Renders the blank CategoryForm.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../../_components/PageHeader";
import { CategoryForm } from "../_components/CategoryForm";

export const metadata: Metadata = { title: "Nova Categoria" };

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        eyebrow="Categorias"
        title="Nova Categoria"
        actions={
          <Link
            href="/dashboard/categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm text-foreground-muted hover:bg-surface-subtle transition-colors"
          >
            ← Voltar
          </Link>
        }
      />
      <div className="p-6 md:p-8 max-w-lg">
        <CategoryForm />
      </div>
    </div>
  );
}
