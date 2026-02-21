/**
 * Sidebar — responsive navigation panel.
 *
 * Mobile  (< lg): Off-canvas drawer.
 *   – Translates in/out from the left via CSS transform.
 *   – Dark overlay behind it; clicking the overlay closes the drawer.
 *   – Route changes auto-close the drawer (useEffect on pathname).
 *
 * Desktop (≥ lg): Static sidebar, always visible.
 *   – Part of the normal document flow (no fixed/absolute positioning).
 *   – Overlay never renders.
 *
 * No business logic — isOpen/onClose are managed by AppShell.
 */

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { NavItem } from "./NavItem";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Nav items config ─────────────────────────────────────────────────────────

const NAV_ITEMS: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>
    ),
  },
  {
    label: "Produtos",
    href: "/dashboard/products",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
    ),
  },
  {
    label: "Encomendas",
    href: "/dashboard/orders",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </svg>
    ),
  },
  {
    label: "Clientes",
    href: "/dashboard/customers",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
    ),
  },
  {
    label: "Configurações",
    href: "/dashboard/settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
];

// ─── Brand mark ───────────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Bolt icon */}
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 text-surface"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.818a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .845-.143Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="text-sm font-semibold text-foreground">
        Encomenda Zap
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    onClose();
    // onClose is stable (useCallback in AppShell), so it's safe to include
  }, [pathname, onClose]);

  /**
   * Active match: exact for /dashboard, prefix for everything else.
   * This prevents /dashboard from staying active on /dashboard/products.
   */
  function isItemActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 z-20 bg-foreground/40 transition-opacity duration-200 lg:hidden",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* ── Sidebar panel ──────────────────────────────────────────────────── */}
      {/*
       * Mobile  : fixed, full-height, translates in from left.
       * Desktop : static (in normal flow), always visible, no transform.
       */}
      <aside
        className={[
          // Size + background
          "flex w-[var(--sidebar-width)] flex-col",
          "bg-surface border-r border-line",
          // Mobile: fixed overlay panel
          "fixed inset-y-0 left-0 z-30",
          "transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: back into normal flow
          "lg:static lg:z-auto lg:translate-x-0 lg:transition-none",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
          <BrandMark />
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4"
          aria-label="Navegação principal"
        >
          <ul role="list" className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavItem
                  {...item}
                  isActive={isItemActive(item.href)}
                  onClick={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer slot — future: avatar, plan badge, etc. */}
        <div className="shrink-0 border-t border-line p-4">
          <p className="text-xs text-foreground-muted">
            © {new Date().getFullYear()} Encomenda Zap
          </p>
        </div>
      </aside>
    </>
  );
}
