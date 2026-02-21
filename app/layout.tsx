import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ─── Font ─────────────────────────────────────────────────────────────────────
// Inter is loaded via next/font (zero CLS, self-hosted, GDPR-safe).
// The CSS variable --font-inter is injected on <html> and consumed by
// --font-sans inside globals.css @theme.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  // `swap` keeps system font visible during load — prevents invisible text
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────
// `template` adds the site name as suffix: "Entrar | Encomenda Zap"
export const metadata: Metadata = {
  title: {
    default: "Encomenda Zap",
    template: "%s | Encomenda Zap",
  },
  description:
    "Gerencie encomendas, agendamentos e o catálogo digital do seu negócio.",
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // inter.variable injects the CSS variable so globals.css @theme can reference it
    <html lang="pt-BR" className={inter.variable}>
      {/* font-sans picks up var(--font-inter) defined in @theme */}
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
