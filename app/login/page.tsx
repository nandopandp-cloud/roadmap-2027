import type { Metadata } from "next";
import { Layers2 } from "lucide-react";
import { LoginScene } from "@/components/auth/login-scene";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ALLOWED_DOMAIN, safeNextPath } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Entrar" };

type Search = Promise<{ erro?: string; next?: string; saiu?: string }>;

const MESSAGES: Record<string, { tone: "error" | "info"; text: string }> = {
  dominio: { tone: "error", text: `Esta conta não tem acesso. Entre com um e-mail @${ALLOWED_DOMAIN}.` },
  cancelado: { tone: "info", text: "Login cancelado. Escolha sua conta institucional para continuar." },
  expirado: { tone: "error", text: "O login demorou demais ou foi interrompido. Tente novamente." },
  sessao: { tone: "info", text: "Sua sessão expirou. Entre novamente para continuar." },
  config: { tone: "error", text: "O login com Google ainda não foi configurado neste ambiente. Avise o time de Produto." },
  falha: { tone: "error", text: "Não foi possível concluir o login com o Google. Tente novamente." },
};

function GoogleMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const message = params.saiu ? { tone: "info" as const, text: "Você saiu da sua conta." } : params.erro ? MESSAGES[params.erro] : undefined;
  const href = next === "/" ? "/api/auth/google" : `/api/auth/google?next=${encodeURIComponent(next)}`;

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#1c0b47] lg:flex-row">
      {/* Painel ilustrado */}
      <section className="relative isolate flex min-h-[600px] flex-col overflow-hidden px-6 pb-40 pt-8 sm:px-12 sm:pt-12 lg:min-h-dvh lg:w-[calc(56%+4rem)] lg:px-[6%] lg:pb-0 lg:pt-[4.5vh]">
        <LoginScene id="cena-m" className="absolute inset-0 -z-10 h-full w-full lg:hidden" />
        <LoginScene id="cena-d" align="end" className="absolute inset-0 -z-10 hidden h-full w-full lg:block" />

        <div className="flex items-center gap-5 sm:gap-6">
          <BrandLogo onDark className="w-[128px] sm:w-[150px]" />
          <span aria-hidden className="h-11 w-px bg-white/45 sm:h-[52px]" />
          <span className="text-[24px] font-extrabold tracking-[-0.01em] text-white sm:text-[30px]">Roadmap</span>
        </div>

        <div className="mt-12 max-w-[560px] sm:mt-16 lg:mt-[9vh]">
          <h1 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-[48px] xl:text-[56px]">
            Planejamento, priorização e evolução dos <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#b66dff] via-[#e070c8] to-[#ff9a3c] bg-clip-text text-transparent [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
              nossos produtos
            </span>
          </h1>
          <p className="mt-5 max-w-[470px] text-[17px] leading-relaxed text-white/80 sm:text-[20px] xl:text-[22px]">
            Acompanhe a estratégia, iniciativas, entregas e resultados em um só lugar.
          </p>
        </div>
      </section>

      {/* Painel de acesso */}
      <main className="relative z-10 -mt-12 flex flex-1 items-center justify-center rounded-t-[40px] bg-[#f7f6fb] px-6 py-14 shadow-[0_-20px_60px_rgb(20_8_60/0.35)] sm:px-10 lg:-ml-16 lg:mt-0 lg:rounded-l-[64px] lg:rounded-tr-none lg:py-10">
        <div className="flex w-full max-w-[580px] flex-col items-center text-center">
          <span className="flex h-[88px] w-[88px] items-center justify-center rounded-[24px] bg-[#ece4fd] text-[#6a3fd6] sm:h-[104px] sm:w-[104px] sm:rounded-[26px]">
            <Layers2 size={52} strokeWidth={2.2} aria-hidden />
          </span>

          <h2 className="mt-9 text-[32px] font-black leading-[1.15] tracking-[-0.02em] text-[#120f45] sm:text-[40px]">
            Acesse a plataforma
            <br />
            de Roadmap
          </h2>
          <p className="mt-5 max-w-[390px] text-[18px] leading-relaxed text-[#5a5f84] sm:text-[20px]">Use sua conta institucional do Google para continuar.</p>

          {message && (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={
                message.tone === "error"
                  ? "mt-8 w-full rounded-2xl border border-[#f3c6cf] bg-[#fff1f3] px-4 py-3 text-[15px] font-semibold text-[#a3213f]"
                  : "mt-8 w-full rounded-2xl border border-[#d9d1f5] bg-[#f1ecfb] px-4 py-3 text-[15px] font-semibold text-[#4a2d91]"
              }
            >
              {message.text}
            </p>
          )}

          <a
            href={href}
            className="group mt-10 flex h-[68px] w-full items-center justify-center gap-6 rounded-[18px] border border-[#dcd7ec] bg-white text-[19px] font-extrabold text-[#120f45] shadow-[0_6px_20px_rgb(40_20_110/0.08)] transition hover:-translate-y-px hover:border-[#c9bff0] hover:shadow-[0_10px_28px_rgb(40_20_110/0.13)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6a3fd6]/30 active:translate-y-0 sm:h-[76px] sm:text-[21px]"
          >
            <GoogleMark />
            Continuar com o Google
          </a>
        </div>
      </main>
    </div>
  );
}
