import Image from "next/image";
import { cn } from "@/lib/client/cn";

/**
 * Logo oficial da Jovens Gênios (arquivo original em public/brand/).
 * A versão horizontal tem ícone roxo e texto claro, adequada ao fundo escuro do menu.
 * No modo compacto, exibe apenas o ícone recortando o mesmo arquivo — sem redesenhar a marca.
 */
export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span className={cn("relative block h-[42px] w-[42px] overflow-hidden", className)}>
        <Image
          src="/brand/jovens-genios-horizontal.png"
          alt="Jovens Gênios"
          width={125}
          height={42}
          priority
          className="absolute left-0 top-0 h-[42px] w-auto max-w-none"
        />
      </span>
    );
  }
  return (
    <Image
      src="/brand/jovens-genios-horizontal.png"
      alt="Jovens Gênios"
      width={256}
      height={86}
      priority
      className={cn("h-auto w-[148px]", className)}
    />
  );
}
