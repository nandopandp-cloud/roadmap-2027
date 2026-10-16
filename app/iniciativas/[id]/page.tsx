import { redirect } from "next/navigation";

/** Detalhes abrem no drawer: links diretos para /iniciativas/<id> são redirecionados. */
export default async function InitiativeRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/iniciativas?iniciativa=${encodeURIComponent(id)}`);
}
