/**
 * Dashboard Layout — authenticated visual shell.
 *
 * Renders the AppShell (Sidebar + Header + main area) around every route
 * under /dashboard/*.
 *
 * Server Component responsibilities:
 *   1. Read the verified session (storeId guaranteed by parent (protected)/layout.tsx).
 *   2. Fetch the store name from the DB for the header.
 *   3. Render AppShell (Client Component) with server data as props.
 *
 * The session is already validated by (protected)/layout.tsx — this layout
 * never redirects; it only reads data.
 */

import { type ReactNode } from "react";
import { AppShell } from "../../_components/AppShell";
import { getSession } from "@/infra/http/auth/getSession";
import { prisma } from "@/infra/prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  // Fetch store name — storeId is always valid here (verified by parent layout)
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: { name: true },
  });

  return (
    <AppShell storeName={store?.name ?? "Minha Loja"}>{children}</AppShell>
  );
}
