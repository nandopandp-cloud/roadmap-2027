import type { Metadata } from "next";
import { Suspense } from "react";
import { OrgView } from "@/components/org/org-view";

export const metadata: Metadata = { title: "Times & Squads" };

export default function TimesPage() {
  return (
    <Suspense fallback={null}>
      <OrgView />
    </Suspense>
  );
}
