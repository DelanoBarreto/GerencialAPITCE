import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./design-tokens.css";
import "./styles.css";

export const metadata: Metadata = {
  title: {
    default: "APITCE | Gestão municipal",
    template: "%s | APITCE"
  },
  description: "Inteligência financeira municipal a partir dos dados oficiais do SIM/TCE-CE"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
