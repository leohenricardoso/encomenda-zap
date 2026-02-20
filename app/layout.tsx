import { ReactNode } from "react";

export const metadata = {
  title: "Encomenda Zap",
  description: "Next.js + TypeScript + App Router",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
