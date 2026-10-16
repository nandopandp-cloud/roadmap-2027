import type { Metadata } from "next";
import { Suspense } from "react";
import { ContextView } from "@/components/context/context-view";

export const metadata: Metadata = { title: "Contexto estratégico" };

export default function ContextPage() {
  return (
    <Suspense fallback={null}>
      <ContextView />
    </Suspense>
  );
}
