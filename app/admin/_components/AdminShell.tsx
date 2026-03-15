"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminShellProps {
  children: ReactNode;
  adminName: string | null;
}

export function AdminShell({ children, adminName }: AdminShellProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <AdminSidebar adminName={adminName} onLogout={handleLogout} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
