import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ConfirmProvider } from "@/components/ui/dialog";
import { ToastProvider } from "@/components/ui/toast";
import { listIllustrationFiles } from "@/lib/assets/available";
import { AssetsProvider } from "@/lib/client/assets";
import { RoadmapProvider } from "@/lib/client/store";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Jovens Gênios — Roadmap 2027", template: "%s · Roadmap 2027 · Jovens Gênios" },
  description: "Repositório central de planejamento, documentação e acompanhamento das iniciativas de Produto da Jovens Gênios.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#17145b" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <body className="font-sans">
        <AssetsProvider files={listIllustrationFiles()}>
          <ToastProvider>
            <ConfirmProvider>
              <RoadmapProvider>
                <AppShell>{children}</AppShell>
              </RoadmapProvider>
            </ConfirmProvider>
          </ToastProvider>
        </AssetsProvider>
      </body>
    </html>
  );
}
