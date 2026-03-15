import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { verifySuperAdminToken } from "@/infra/security/superAdminTokenService";
import { SA_COOKIE_NAME } from "@/infra/http/cookies/superAdminCookie";
import AdminLoginForm from "./_components/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin — Entrar",
  description: "Painel de administração da plataforma.",
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SA_COOKIE_NAME)?.value;

  if (token) {
    try {
      await verifySuperAdminToken(token);
      redirect("/admin/stores");
    } catch {
      // Invalid token — render the login form
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25">
            <svg
              className="size-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Super Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acesso restrito — plataforma Encomenda Zap
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Área restrita. Acesso não autorizado é proibido.
        </p>
      </div>
    </div>
  );
}
