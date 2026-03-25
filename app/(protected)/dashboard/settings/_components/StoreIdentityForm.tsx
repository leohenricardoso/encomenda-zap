"use client";

/**
 * StoreIdentityForm — lets a store owner update the store name and URL slug.
 *
 * Behaviour:
 *  – As the user types in the name field, the slug is auto-populated
 *    (via client-side slugify) while the user hasn't manually edited it.
 *  – Once the slug field is touched directly the auto-sync stops.
 *  – A 600 ms debounce fires `checkSlugAvailability` so the user gets
 *    real-time "Disponível / Já em uso" feedback without hammering the server.
 *  – On save, the full `saveStoreIdentity` server action is called.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "../../../../_components/Input";
import { Button } from "../../../../_components/Button";
import { InlineFeedback } from "../../../../_components/InlineFeedback";
import { saveStoreIdentity, checkSlugAvailability } from "../actions";

// ─── Minimal client-side slugify (mirrors the server validation) ──────────────

function slugifyClient(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SlugStatus = "idle" | "checking" | "available" | "taken";

interface StoreIdentityFormProps {
  initialName: string;
  initialSlug: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StoreIdentityForm({
  initialName,
  initialSlug,
}: StoreIdentityFormProps) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-slugify from name ────────────────────────────────────────────────
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyClient(name));
    }
  }, [name, slugTouched]);

  // ── Debounced availability check ─────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    debounceRef.current = setTimeout(async () => {
      const result = await checkSlugAvailability(slug);
      setSlugStatus(result.available ? "available" : "taken");
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug]);

  // ── Save handler ──────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await saveStoreIdentity(name, slug);
      if (result.success) {
        setFeedback({ type: "success", message: "Informações salvas!" });
        setSlugTouched(false); // re-enable auto-sync for future name edits
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  // ── Slug status badge ─────────────────────────────────────────────────────
  const slugHint =
    slugStatus === "checking"
      ? "Verificando…"
      : slugStatus === "available"
        ? "✓ Disponível"
        : slugStatus === "taken"
          ? "✗ Slug já em uso"
          : undefined;

  const slugHintClass =
    slugStatus === "available"
      ? "text-green-600"
      : slugStatus === "taken"
        ? "text-red-600"
        : "text-foreground-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <Input
        id="store-name"
        label="Nome da loja"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Padaria do João"
        required
        minLength={2}
        maxLength={100}
        disabled={isPending}
      />

      {/* Slug */}
      <div className="space-y-1">
        <Input
          id="store-slug"
          label="Endereço do catálogo"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugifyClient(e.target.value));
          }}
          placeholder="Ex: padaria-do-joao"
          required
          minLength={3}
          maxLength={63}
          disabled={isPending}
        />
        <div className="flex items-center gap-2">
          <p className="text-xs text-foreground-muted">
            /catalog/
            <span className="font-mono">{slug || "…"}</span>
          </p>
          {slugHint && (
            <span className={`text-xs font-medium ${slugHintClass}`}>
              {slugHint}
            </span>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <InlineFeedback type={feedback.type} message={feedback.message} />
      )}

      <Button
        type="submit"
        disabled={
          isPending || slugStatus === "taken" || slugStatus === "checking"
        }
      >
        {isPending ? "Salvando…" : "Salvar identidade"}
      </Button>
    </form>
  );
}
