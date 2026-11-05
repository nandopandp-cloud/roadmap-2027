import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CONTEXT_LOCKED } from "@/lib/features";
import { ContextView } from "@/components/context/context-view";

export const metadata: Metadata = { title: "Contexto estratégico" };

export default function ContextPage() {
  if (CONTEXT_LOCKED) redirect("/iniciativas");
  return (
    <Suspense fallback={null}>
      <ContextView />
    </Suspense>
  );
}
