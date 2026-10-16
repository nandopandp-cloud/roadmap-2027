import Image from "next/image";
import { cn } from "@/lib/client/cn";

/**
 * Logo oficial da Jovens Gênios (arquivo original em public/brand/).
 * Por padrão usa a variante com texto escuro (fundos claros); `onDark` usa o arquivo original de texto claro.
 * No modo compacto, exibe apenas o ícone recortando o mesmo arquivo — sem redesenhar a marca.
 */
export function BrandLogo({ compact = false, onDark = false, className }: { compact?: boolean; onDark?: boolean; className?: string }) {
  // Mesmo arquivo oficial; a variante "escuro" só recolore o texto (azul-marinho) para fundos claros.
  const src = onDark ? "/brand/jovens-genios-horizontal.png" : "/brand/jovens-genios-horizontal-escuro.png";
  if (compact) {
    return (
      <span className={cn("relative block h-[42px] w-[42px] overflow-hidden", className)}>
        <Image
          src={src}
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
      src={src}
      alt="Jovens Gênios"
      width={256}
      height={86}
      priority
      className={cn("h-auto w-[148px]", className)}
    />
  );
}
