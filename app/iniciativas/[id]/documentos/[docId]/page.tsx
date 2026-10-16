import type { Metadata } from "next";
import { Suspense } from "react";
import { DocumentView } from "@/components/documents/document-view";

export const metadata: Metadata = { title: "Documento" };

export default async function DocumentPage({ params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  return (
    <Suspense fallback={null}>
      <DocumentView initiativeId={decodeURIComponent(id)} documentId={decodeURIComponent(docId)} />
    </Suspense>
  );
}
