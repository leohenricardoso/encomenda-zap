"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
}

function NavLink({ href, icon, label }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <span
        className={[
          "size-5 shrink-0",
          active ? "text-blue-600" : "text-slate-400",
        ].join(" ")}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

interface AdminSidebarProps {
  adminName: string | null;
  onLogout: () => void;
}

export function AdminSidebar({ adminName, onLogout }: AdminSidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-blue-500 shadow shadow-blue-500/25">
          <svg
            className="size-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-slate-900">
            Super Admin
          </p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-400">
            Plataforma
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Gerenciar
        </p>
        <NavLink
          href="/admin/stores"
          label="Lojas"
          icon={
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className="size-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
              />
            </svg>
          }
        />
      </nav>

      {/* Footer / User */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-blue-500 text-xs font-bold text-white">
            {adminName ? adminName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {adminName ?? "Super Admin"}
            </p>
            <p className="text-xs text-slate-400">Administrador</p>
          </div>
          <button
            onClick={onLogout}
            title="Sair"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
