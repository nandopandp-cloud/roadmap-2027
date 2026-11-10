"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { ROLE_LABEL } from "@/lib/auth/config";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { EFFORT_TRACK_LABEL } from "@/lib/domain/effort";
import { effortTracksFor } from "@/lib/domain/effort-access";

function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function ViewerAvatar({ name, picture, size }: { name: string; picture: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (picture && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto da conta Google (domínio externo)
      <img
        src={picture}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover ring-2 ring-white"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-violet text-[13px] font-black text-white ring-2 ring-white"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </span>
  );
}

/** Pessoa conectada, perfil de acesso e saída. Fica abaixo da navegação (não é item de menu). */
export function UserCard({ compact }: { compact: boolean }) {
  const { data } = useRoadmap();
  const viewer = data.viewer;
  if (!viewer) return null;
  // Perfil de consulta que estima esforço (tech lead, coordenação de design) aparece como tal.
  const leadTracks = viewer.role === "editor" ? [] : effortTracksFor(viewer, data.people);
  const role = leadTracks.length
    ? `Consulta · estima ${leadTracks.map((t) => EFFORT_TRACK_LABEL[t]).join(" e ")}`
    : ROLE_LABEL[viewer.role];

  const logout = (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={cn(
          "group relative flex items-center justify-center rounded-xl text-[#4a557f] transition hover:bg-white hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40",
          compact ? "h-10 w-10" : "h-9 w-9",
        )}
        aria-label="Sair da conta"
        title="Sair"
      >
        <LogOut size={18} aria-hidden />
      </button>
    </form>
  );

  if (compact) {
    return (
      <div className="relative z-10 mt-6 flex flex-col items-center gap-1.5 px-2.5">
        <span title={`${viewer.name} · ${role}`}>
          <ViewerAvatar name={viewer.name} picture={viewer.picture} size={38} />
          <span className="sr-only">
            Conectado como {viewer.name} ({role})
          </span>
        </span>
        {logout}
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-3 mt-6 flex items-center gap-2.5 rounded-[16px] bg-white/70 p-2.5 shadow-[0_4px_14px_rgba(70,50,160,0.08)]">
      <ViewerAvatar name={viewer.name} picture={viewer.picture} size={36} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-[13px] font-extrabold leading-tight text-navy" title={viewer.email}>
          {viewer.name}
        </p>
        <p className={cn("mt-0.5 text-[11.5px] font-bold leading-tight", viewer.role === "editor" ? "text-violet" : "text-muted")}>{role}</p>
      </div>
      {logout}
    </div>
  );
}
