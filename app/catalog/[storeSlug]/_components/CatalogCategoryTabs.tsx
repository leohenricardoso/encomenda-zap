"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { StoreCatalogCategory } from "@/domain/catalog/types";

interface Props {
  storeSlug: string;
  categories: StoreCatalogCategory[];
}

const SCROLL_KEY = "categoryTabsScrollLeft";

export function CatalogCategoryTabs({ storeSlug, categories }: Props) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 60) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = current;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll position after navigation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      container.scrollLeft = Number(saved);
    }
  }, []);

  // Persist scroll position as the user scrolls the tab bar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    function handleContainerScroll() {
      sessionStorage.setItem(SCROLL_KEY, String(container!.scrollLeft));
    }
    container.addEventListener("scroll", handleContainerScroll, {
      passive: true,
    });
    return () => container.removeEventListener("scroll", handleContainerScroll);
  }, []);

  if (categories.length === 0) return null;

  const allHref = `/catalog/${storeSlug}`;
  const isAllActive = pathname === allHref || pathname === `${allHref}/`;

  return (
    <div
      className={[
        "sticky top-0 z-10 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] shadow-sm",
        "transition-transform duration-300 ease-in-out",
        hidden ? "-translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <div
        ref={scrollContainerRef}
        className="mx-auto flex max-w-screen-xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8"
      >
        <Link
          href={allHref}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            isAllActive
              ? "bg-accent text-white"
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
                  ? "bg-accent text-white"
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
