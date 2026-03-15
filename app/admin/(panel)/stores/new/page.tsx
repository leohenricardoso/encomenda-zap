import type { Metadata } from "next";
import Link from "next/link";
import { CreateStoreForm } from "../_components/CreateStoreForm";

export const metadata: Metadata = {
  title: "Nova Loja — Super Admin",
};

export default function NewStorePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/admin/stores"
          className="hover:text-slate-900 transition-colors"
        >
          Lojas
        </Link>
        <svg
          className="size-4 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-slate-900 font-medium">Nova loja</span>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Nova loja</h1>
        <p className="mt-1 text-sm text-slate-500">
          Preencha os dados para criar uma nova loja na plataforma.
        </p>
      </div>

      <CreateStoreForm />
    </div>
  );
}
