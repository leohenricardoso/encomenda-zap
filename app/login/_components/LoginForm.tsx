"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../_components/Button";
import { Input } from "../../_components/Input";

/**
 * LoginForm — Client Component for the /login page.
 *
 * Responsibilities (presentational + minimal interaction only):
 * - Render email + password fields via the shared Input component
 * - Submit credentials to POST /api/auth/login
 * - Display server error via the styled error banner
 * - Redirect on success (cookie was set server-side; we just navigate)
 *
 * No business logic lives here — all validation is server-side.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Server always returns a generic message — no field-level hints
        setError(data?.error?.message ?? "Credenciais inválidas.");
        return;
      }

      // Cookie was set server-side; redirect to originally requested page
      const next = searchParams.get("next") ?? "/dashboard";
      router.replace(next);
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* ── Error banner ────────────────────────────────────────────────────
          role="alert" triggers a live region announcement for screen readers.
          Conditionally rendered — no empty space when there's no error.
      ─────────────────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className={[
            "flex items-start gap-3 rounded-lg px-4 py-3 text-sm",
            "border border-danger/20 bg-danger/5 text-danger",
          ].join(" ")}
        >
          <AlertIcon className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Fields ── */}
      <Input
        label="E-mail"
        id="email"
        type="email"
        autoComplete="email"
        required
        placeholder="voce@empresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Senha"
        id="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* ── Submit ── */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        // Full width — full card width feels more polished for an auth form
        className="w-full"
      >
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

interface IconProps {
  className?: string;
}

function AlertIcon({ className = "" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 ${className}`}
    >
      {/* Heroicons: exclamation-circle (solid) */}
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
