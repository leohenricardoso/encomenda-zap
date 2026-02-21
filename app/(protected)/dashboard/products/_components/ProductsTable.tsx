"use client";

import Link from "next/link";
import ToggleActiveButton from "./ToggleActiveButton";
import type { Product } from "@/domain/product/types";

interface Props {
  products: Product[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export default function ProductsTable({ products }: Props) {
  if (products.length === 0) {
    return (
      <p>
        No products found.{" "}
        <Link href="/dashboard/products/new">Add your first product</Link>.
      </p>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Price</th>
          <th scope="col">Status</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.price != null ? formatPrice(product.price) : "—"}</td>
            <td>
              <span aria-label={product.isActive ? "Active" : "Inactive"}>
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td>
              <Link href={`/dashboard/products/${product.id}/edit`}>Edit</Link>
              {" · "}
              <ToggleActiveButton
                productId={product.id}
                isActive={product.isActive}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
