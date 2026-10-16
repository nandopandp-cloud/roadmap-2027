"use client";

import { ArrowLeft, ExternalLink, MonitorPlay, Monitor, Smartphone, Tablet, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageContainer, TopBar } from "@/components/layout/page-header";
import { PlatformChip } from "@/components/platforms/platform-icon";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { useArtifactStatus } from "@/lib/client/use-artifact-status";
import { prototypeHref } from "@/lib/domain/artifacts";
import type { Platform } from "@/lib/domain/types";

const VIEWPORTS = [
  { key: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { key: "tablet", label: "Tablet", icon: Tablet, width: "820px" },
  { key: "mobile", label: "Celular", icon: Smartphone, width: "390px" },
] as const;

/**
 * Pré-visualização isolada de protótipos HTML locais. O iframe usa `sandbox`
 * sem `allow-same-origin` e a rota /prototipos envia CSP `sandbox`: o protótipo
 * não acessa cookies, armazenamento nem o DOM da aplicação.
 */
export function PrototypeView({ initiativeId, prototypeId }: { initiativeId: string; prototypeId: string }) {
  const { load, initiativeById, data } = useRoadmap();
  const [viewport, setViewport] = useState<(typeof VIEWPORTS)[number]["key"]>("desktop");
  const initiative = initiativeById(initiativeId);
  const proto = initiative?.prototypes.find((p) => p.id === prototypeId);
  const status = useArtifactStatus(proto?.source === "repo" ? [proto.path] : []);
  const exists = proto?.source === "repo" ? status[proto.path] : true;
  const backHref = `/iniciativas?iniciativa=${initiativeId}&aba=prototipo`;
  const crumbs = [
    { label: "Iniciativas", href: "/iniciativas" },
    { label: initiativeId, href: backHref },
    { label: "Protótipo" },
  ];

  if (load.status === "loading") {
    return (
      <PageContainer>
        <TopBar crumbs={crumbs} />
        <Skeleton className="mt-8 h-[70vh] w-full" />
      </PageContainer>
    );
  }

  if (!initiative || !proto) {
    return (
      <PageContainer>
        <TopBar crumbs={crumbs} />
        <EmptyState
          className="mt-10"
          icon={<MonitorPlay size={22} />}
          title="Protótipo não encontrado"
          description="Este protótipo não está associado à iniciativa."
          action={<Link href={backHref} className={buttonClass("primary")}>Voltar para a iniciativa</Link>}
        />
      </PageContainer>
    );
  }

  const href = prototypeHref(proto);
  const platforms = proto.platformIds.map((id) => data.platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p);
  const width = VIEWPORTS.find((v) => v.key === viewport)!.width;

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col px-4 pb-10 pt-6 sm:px-8">
      <TopBar crumbs={crumbs} />
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-blue hover:underline">
            <ArrowLeft size={16} aria-hidden /> Voltar para {initiative.title}
          </Link>
          <h1 className="mt-2 text-[26px] font-black text-navy">{proto.name}</h1>
          {proto.description && <p className="mt-1 max-w-3xl text-[14.5px] text-muted">{proto.description}</p>}
          {platforms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {platforms.map((p) => (
                <PlatformChip key={p.id} platform={p} />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Largura da visualização" className="flex rounded-xl border border-line bg-surface p-1">
            {VIEWPORTS.map((v) => (
              <button
                key={v.key}
                type="button"
                role="radio"
                aria-checked={viewport === v.key}
                onClick={() => setViewport(v.key)}
                title={v.label}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold", viewport === v.key ? "bg-navy text-white" : "text-muted hover:text-ink")}
              >
                <v.icon size={15} aria-hidden />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
            <ExternalLink size={16} aria-hidden /> Abrir em nova aba
          </a>
        </div>
      </div>

      {exists === false ? (
        <EmptyState
          className="mt-8"
          icon={<TriangleAlert size={22} />}
          title="Arquivo do protótipo não encontrado"
          description={<>O caminho <code className="font-mono text-[12px]">{proto.path}</code> não existe no repositório. Corrija o caminho na edição da iniciativa.</>}
        />
      ) : proto.source === "externo" ? (
        <EmptyState
          className="mt-8"
          icon={<ExternalLink size={22} />}
          title="Protótipo externo"
          description="Protótipos hospedados fora do repositório são abertos em uma nova aba."
          action={<a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>Abrir protótipo</a>}
        />
      ) : exists === undefined ? (
        <Skeleton className="mt-6 h-[75vh] w-full" />
      ) : (
        <div className="mt-6 flex justify-center rounded-3xl border border-line bg-[#e9eef8] p-3">
          <iframe
            title={`Protótipo: ${proto.name}`}
            src={href}
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
            referrerPolicy="no-referrer"
            className="h-[78vh] rounded-2xl border border-line bg-white shadow-[var(--shadow-card)] transition-[width] duration-200"
            style={{ width, maxWidth: "100%" }}
          />
        </div>
      )}
      <p className="mt-3 text-[12.5px] text-muted">
        Visualização isolada: o protótipo roda em sandbox, sem acesso aos dados da aplicação. Funcionalidades marcadas como simuladas no protótipo não autenticam de verdade.
      </p>
    </div>
  );
}
