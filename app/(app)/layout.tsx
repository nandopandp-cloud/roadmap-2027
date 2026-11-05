import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ConfirmProvider } from "@/components/ui/dialog";
import { ToastProvider } from "@/components/ui/toast";
import { listIllustrationFiles } from "@/lib/assets/available";
import { AssetsProvider } from "@/lib/client/assets";
import { RoadmapProvider } from "@/lib/client/store";

/** Área autenticada: sidebar, dados e camadas (drawer, formulários). O acesso é garantido pelo proxy.ts. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AssetsProvider files={listIllustrationFiles()}>
      <ToastProvider>
        <ConfirmProvider>
          <RoadmapProvider>
            <AppShell>{children}</AppShell>
          </RoadmapProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AssetsProvider>
  );
}
