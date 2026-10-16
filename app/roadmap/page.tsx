import type { Metadata } from "next";
import { Suspense } from "react";
import { RoadmapView } from "@/components/roadmap/roadmap-view";

export const metadata: Metadata = { title: "Roadmap" };

export default function RoadmapPage() {
  return (
    <Suspense fallback={null}>
      <RoadmapView />
    </Suspense>
  );
}
