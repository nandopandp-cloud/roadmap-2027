import type { Metadata } from "next";
import { PrototypeView } from "@/components/documents/prototype-view";

export const metadata: Metadata = { title: "Protótipo" };

export default async function PrototypePage({ params }: { params: Promise<{ id: string; protoId: string }> }) {
  const { id, protoId } = await params;
  return <PrototypeView initiativeId={decodeURIComponent(id)} prototypeId={decodeURIComponent(protoId)} />;
}
