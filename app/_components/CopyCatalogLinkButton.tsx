"use client";

/**
 * CopyCatalogLinkButton — copies the public catalog URL to the clipboard.
 *
 * Renders a compact icon-button in the dashboard header.
 * Shows a brief "Copiado!" confirmation for 2 seconds after a successful copy.
 */

import { useState } from "react";

interface CopyCatalogLinkButtonProps {
  slug: string;
}

export function CopyCatalogLinkButton({ slug }: CopyCatalogLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/catalog/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copiado!" : "Copiar link do catálogo"}
      aria-label={copied ? "Link copiado" : "Copiar link do catálogo"}
      className={[
        "-m-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        "transition-colors ring-focus",
        copied
          ? "text-green-600"
          : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
      ].join(" ")}
    >
      {copied ? <CheckIcon /> : <LinkIcon />}
      <span className="hidden sm:inline">
        {copied ? "Copiado!" : "Catálogo"}
      </span>
    </button>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}
