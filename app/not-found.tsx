import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <EmptyState
        icon={<Compass size={22} />}
        title="Página não encontrada"
        description="O endereço acessado não existe neste roadmap."
        action={<LinkButton href="/iniciativas" variant="primary">Ir para Iniciativas</LinkButton>}
      />
    </div>
  );
}
