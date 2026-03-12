"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StoreCatalogCategory } from "@/domain/catalog/types";

interface Props {
  storeSlug: string;
  categories: StoreCatalogCategory[];
}

export function CatalogCategoryTabs({ storeSlug, categories }: Props) {
  const pathname = usePathname();

  if (categories.length === 0) return null;

  const allHref = `/catalog/${storeSlug}`;
  const isAllActive = pathname === allHref || pathname === `${allHref}/`;

  return (
    <div className="sticky top-0 z-10 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] shadow-sm">
      <div className="mx-auto flex max-w-screen-xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href={allHref}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            isAllActive
              ? "bg-[rgb(var(--color-accent))]"
              : "text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg-muted))]"
          }`}
        >
          Todos
        </Link>
        {categories.map((cat) => {
          const href = `/catalog/${storeSlug}/c/${cat.slug}`;
          const isActive = pathname === href;
          return (
            <Link
              key={cat.id}
              href={href}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[rgb(var(--color-accent))]"
                  : "text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-bg-muted))]"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
