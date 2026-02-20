"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Calls POST /api/auth/logout, which clears the HttpOnly cookie server-side,
 * then redirects to /login.
 */
export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <button onClick={handleLogout} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
