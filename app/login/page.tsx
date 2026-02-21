import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { verifyToken } from "@/infra/security/tokenService";
import { Card } from "../_components/Card";
import LoginForm from "./_components/LoginForm";

// ─── SEO ──────────────────────────────────────────────────────────────────────
// Renders as "Entrar | Encomenda Zap" via the template defined in layout.tsx
export const metadata: Metadata = {
  title: "Entrar",
  description: "Faça login para acessar o painel do Encomenda Zap.",
};

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "__session";

// ─── Page ────────────────────────────────────────────────────────────────────
/**
 * /login — Server Component.
 *
 * Auth check runs on the server before anything reaches the browser:
 * - Valid session  → redirect /dashboard (no flash of login page)
 * - No session     → render the login form
 *
 * LoginForm uses useSearchParams() which needs a Suspense boundary
 * to avoid blocking the static shell in Next.js 15+.
 */
export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    try {
      await verifyToken(token);
      redirect("/dashboard");
    } catch {
      // Token invalid/expired — fall through and show the login form
    }
  }

  return (
    // min-h-dvh uses the dynamic viewport height (handles mobile browser chrome)
    <div className="min-h-dvh bg-surface-subtle flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] space-y-8">
        {/* ── Brand mark ── */}
        <div className="flex flex-col items-center gap-4 text-center">
          <LogoMark />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Acessar sua conta
            </h1>
            <p className="text-sm text-foreground-muted">
              Bem-vindo de volta. Faça login para continuar.
            </p>
          </div>
        </div>

        {/* ── Form card ── */}
        <Card>
          {/*
            Suspense is required: LoginForm calls useSearchParams(),
            a dynamic API that opts out of static rendering.
            The fallback is invisible — the form appears without flash.
          */}
          <Suspense fallback={<FormSkeleton />}>
            <LoginForm />
          </Suspense>
        </Card>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-foreground-muted">
          © {new Date().getFullYear()} Encomenda Zap. Todos os direitos
          reservados.
        </p>
      </div>
    </div>
  );
}

// ─── Brand mark ──────────────────────────────────────────────────────────────
/**
 * Logo composed of an inline SVG icon (lightning bolt = "Zap") and the
 * product name. No external image dependency — safe to render server-side.
 */
function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon container — dark fill matches primary button colour */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground shadow-sm">
        <svg
          aria-hidden="true"
          className="h-5 w-5 text-surface"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          {/* Heroicons: bolt (solid) */}
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Encomenda Zap
      </span>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
/**
 * Shown inside Suspense while LoginForm's JS bundle loads.
 * Matches the form's approximate height to prevent layout shift.
 */
function FormSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden="true">
      {/* Email field */}
      <div className="space-y-1.5">
        <div className="h-4 w-12 rounded bg-surface-hover" />
        <div className="h-10 rounded-md bg-surface-hover" />
      </div>
      {/* Password field */}
      <div className="space-y-1.5">
        <div className="h-4 w-10 rounded bg-surface-hover" />
        <div className="h-10 rounded-md bg-surface-hover" />
      </div>
      {/* Button */}
      <div className="h-10 rounded-md bg-surface-hover" />
    </div>
  );
}
