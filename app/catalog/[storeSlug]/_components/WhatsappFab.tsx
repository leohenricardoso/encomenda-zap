interface WhatsappFabProps {
  /** Raw digit string, e.g. "5543999999999". Renders nothing when falsy. */
  whatsapp: string | null | undefined;
  storeName: string;
}

/**
 * WhatsappFab — floating WhatsApp contact button for the public catalog.
 *
 * Sits fixed at bottom-right, above the CartFloatingBar (z-40 < cart z-50).
 * Purely presentational — no client state needed.
 */
export function WhatsappFab({ whatsapp, storeName }: WhatsappFabProps) {
  if (!whatsapp) return null;

  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return null;

  const url = `https://wa.me/${digits}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Falar com ${storeName} pelo WhatsApp`}
      title={`Falar com ${storeName} pelo WhatsApp`}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ backgroundColor: "#25D366" }}
    >
      <WhatsAppIcon className="h-7 w-7 text-white" />
    </a>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.367.63 4.68 1.824 6.708L2.667 29.333l6.84-1.793A13.268 13.268 0 0 0 16.003 29.333c7.367 0 13.33-5.97 13.33-13.333 0-7.364-5.963-13.333-13.33-13.333Zm7.78 18.59c-.323.91-1.88 1.74-2.59 1.85-.662.103-1.5.147-2.42-.153-.558-.18-1.275-.42-2.19-.82-3.856-1.665-6.374-5.556-6.568-5.814-.193-.258-1.575-2.094-1.575-3.993 0-1.9.994-2.832 1.347-3.218.354-.386.772-.483 1.03-.483.257 0 .514.002.74.013.237.012.556-.09.87.664.324.775 1.1 2.676 1.198 2.87.097.193.162.42.032.678-.13.257-.194.418-.387.643-.193.225-.407.503-.58.675-.193.193-.395.402-.17.787.225.386.998 1.646 2.143 2.667 1.472 1.313 2.713 1.718 3.1 1.912.386.193.612.161.837-.097.225-.257.965-1.126 1.222-1.513.257-.386.514-.322.87-.193.354.128 2.25 1.062 2.636 1.255.386.193.643.29.74.45.097.16.097.934-.226 1.843Z" />
    </svg>
  );
}
