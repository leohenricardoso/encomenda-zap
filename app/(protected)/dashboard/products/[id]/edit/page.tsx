import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/infra/http/auth/getSession";
import { getProductByIdUseCase } from "@/infra/composition";
import { ProductForm } from "../../_components/ProductForm";

export const metadata = { title: "Editar Produto" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  let product;
  try {
    product = await getProductByIdUseCase.execute(id, session.storeId);
  } catch {
    notFound();
  }

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
        <span className="text-gray-900 font-medium">Editar produto</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Editar produto</h1>
      <p className="text-sm text-gray-500 mb-6">{product.name}</p>

      <ProductForm
        productId={product.id}
        initialValues={{
          name: product.name,
          description: product.description ?? "",
          price: product.price.toFixed(2),
          isActive: product.isActive,
        }}
      />
    </main>
  );
}
