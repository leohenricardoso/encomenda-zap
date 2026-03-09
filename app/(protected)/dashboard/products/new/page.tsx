import Link from "next/link";
import { ProductForm } from "../_components/ProductForm";

export const metadata = { title: "Novo Produto" };

export default function NewProductPage() {
  return (
    <main className="p-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500 flex items-center gap-1">
        <Link href="/dashboard" className="hover:text-gray-700">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/products" className="hover:text-gray-700">
          Produtos
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Novo produto</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo produto</h1>

      <ProductForm />
    </main>
  );
}
