import { getSession } from "@/infra/http/auth/getSession";
import LogoutButton from "./_components/LogoutButton";

/**
 * Example protected page — app/(protected)/dashboard/page.tsx
 * Route: /dashboard
 *
 * getSession() guarantees this page only renders for authenticated admins.
 * If the session is missing or expired, it redirects to /login server-side.
 */
export default async function DashboardPage() {
  const session = await getSession();

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Store ID: {session.storeId}</p>
      <p>Admin ID: {session.adminId}</p>
      <LogoutButton />
    </main>
  );
}
