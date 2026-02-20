import Link from "next/link";
import { getSession } from "@/infra/http/auth/getSession";
import { listProductsUseCase } from "@/infra/composition";
import ProductsTable from "./_components/ProductsTable";

interface Props {
  // searchParams is kept for future pagination (page, perPage, search)
  searchParams: Promise<{ page?: string }>;
}

/**
 * /dashboard/products — Server Component.
 *
 * - Auth is guaranteed by the (protected) layout above this page.
 * - getSession() is called as a defence-in-depth measure and to get storeId.
 * - Data is fetched directly on the server — no client-side loading states needed.
 * - searchParams is received as a prop for future pagination support.
 */
export default async function ProductsPage({ searchParams }: Props) {
  const session = await getSession();

  // Future: use page/perPage from searchParams for cursor-based pagination
  await searchParams; // resolve the Promise (Next.js 15 dynamic API)

  const products = await listProductsUseCase.execute(session.storeId);

  return (
    <main>
      <header>
        <h1>Products</h1>
        <Link href="/dashboard/products/new">+ New Product</Link>
      </header>

      <ProductsTable products={products} />
    </main>
  );
}
