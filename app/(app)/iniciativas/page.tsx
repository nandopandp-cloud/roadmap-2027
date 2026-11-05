import type { Metadata } from "next";
import { Suspense } from "react";
import { InitiativesView } from "@/components/initiatives/initiatives-view";

export const metadata: Metadata = { title: "Iniciativas" };

export default function InitiativesPage() {
  return (
    <Suspense fallback={null}>
      <InitiativesView />
    </Suspense>
  );
}
