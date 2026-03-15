import type { ReactNode } from "react";
import { getSuperAdminSession } from "@/infra/http/auth/getSuperAdminSession";
import { prisma } from "@/infra/prisma";
import { AdminShell } from "../_components/AdminShell";

/**
 * Admin panel layout — Server Component.
 *
 * Double validation (middleware already ran, but Server Components
 * provide defense-in-depth per the existing convention in this codebase).
 * Fetches super admin name for display in the sidebar.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSuperAdminSession();

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: session.superAdminId },
    select: { name: true },
  });

  return (
    <AdminShell adminName={superAdmin?.name ?? null}>{children}</AdminShell>
  );
}
