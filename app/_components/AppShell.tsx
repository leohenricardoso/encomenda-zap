/**
 * AppShell — authenticated layout chrome.
 *
 * The only Client Component in the layout tree:
 *   - Owns the `isSidebarOpen` state for the mobile drawer.
 *   - Composes Sidebar + Header around page content.
 *   - Server children are passed through as `children` — they are NOT
 *     re-rendered when the sidebar state changes (React Server Components
 *     composition model).
 *
 * Desktop layout:  [ Sidebar (240px) | { Header / Content } ]
 * Mobile layout:   [ Header / Content ] + Sidebar overlay on top
 */

"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: ReactNode;
  /** Passed down from the Server Component layout (e.g. from getSession) */
  storeName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppShell({ children, storeName }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Stable references — prevent Sidebar's useEffect from re-running
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    /*
     * Outer shell: full viewport height, horizontal layout.
     * overflow-hidden keeps the fixed mobile overlay contained.
     */
    <div className="flex h-dvh overflow-hidden bg-surface-subtle">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/*
       * ── Main area ───────────────────────────────────────────────────────
       * flex-1 + min-w-0 ensures it never overflows its grid cell on desktop.
       * overflow-hidden here; only the <main> scrolls vertically.
       */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header onMenuClick={openSidebar} storeName={storeName} />

        {/* Scrollable page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
