import type { Metadata } from "next";
import { Layers2 } from "lucide-react";
import Image from "next/image";
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
    <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden focusable="false">
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
    <div className="flex min-h-dvh bg-[#ece9fb] p-3 sm:p-6 lg:p-8">
      <div className="relative mx-auto flex w-full max-w-[1520px] flex-col overflow-hidden rounded-[32px] bg-[#f1eefc] shadow-[0_24px_70px_rgb(76_56_170/0.16),0_0_0_1px_rgb(120_100_220/0.08)] lg:min-h-[640px] lg:flex-row lg:rounded-[40px]">
        {/* Painel ilustrado: a cena fica ancorada na base; o topo é fundo liso, sob os textos. */}
        <section className="relative isolate flex flex-col px-6 pb-[84vw] pt-8 sm:px-12 sm:pb-[74vw] sm:pt-12 lg:w-[51%] lg:px-[8.5%] lg:pb-0 lg:pt-[clamp(28px,6vh,72px)]">
          <Image
            src="/illustrations/login-cena.jpg"
            alt=""
            width={781}
            height={926}
            priority
            // JPG já otimizado (≈90 KB): servido direto, sem recompressão do otimizador.
            unoptimized
            // Desktop: largura do painel + a faixa que fica sob o canto do cartão (781/733).
            // Em telas baixas a cena encolhe pela altura (para não subir sobre o texto) e a borda direita esmaece.
            className="pointer-events-none absolute bottom-0 left-0 -z-10 h-auto w-full max-w-none select-none [mask-image:linear-gradient(to_bottom,transparent_0%,#000_12%)] lg:h-[min(calc(min(100vw-4rem,1520px)*0.51*781/733*926/781),calc((100dvh-4rem-360px)/0.49))] lg:w-auto lg:[mask-composite:intersect] lg:[mask-image:linear-gradient(to_bottom,transparent_0%,#000_12%),linear-gradient(to_right,#000_93%,transparent_100%)]"
          />

          <div className="flex items-center gap-4 sm:gap-5">
            <BrandLogo className="w-[136px] sm:w-[170px]" />
            <span aria-hidden className="h-10 w-px bg-[#d6cfee] sm:h-12" />
            <span className="text-[24px] font-extrabold tracking-[-0.01em] text-[#5b35c9] sm:text-[29px]">Roadmap</span>
          </div>

          <div className="mt-10 max-w-[500px] sm:mt-14 lg:mt-[clamp(28px,8vh,96px)]">
            <h1 className="text-[34px] font-black leading-[1.1] tracking-[-0.02em] text-navy sm:text-[44px] lg:text-[clamp(34px,4.9vh,50px)]">
              Acompanhe o <br className="hidden sm:inline" />
              futuro dos nossos <br className="hidden sm:inline" />
              <span className="text-[#6a3fd6]">produtos</span>
            </h1>
            <p className="mt-4 max-w-[460px] text-[16px] leading-relaxed text-[#5f6488] sm:text-[19px] lg:text-[clamp(16px,2.05vh,21px)]">
              Planejamento, prioridades e entregas da Jovens Gênios, em um só lugar.
            </p>
          </div>
        </section>

        {/* Painel de acesso */}
        <main className="relative z-10 flex flex-1 items-center justify-center rounded-[32px] bg-[#fbfaff] px-6 py-12 shadow-[-12px_0_40px_rgb(76_56_170/0.08)] ring-1 ring-[#ece8f8] sm:px-10 lg:rounded-[40px] lg:py-10">
          <div className="flex w-full max-w-[440px] flex-col items-center text-center">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-[#ece6fd] text-[#6a3fd6] sm:h-[88px] sm:w-[88px] sm:rounded-[24px]">
              <Layers2 size={42} strokeWidth={2.2} aria-hidden />
            </span>

            <h2 className="mt-7 text-[26px] font-black leading-[1.2] tracking-[-0.015em] text-navy sm:text-[32px]">
              Acesse a plataforma
              <br />
              de Roadmap
            </h2>
            <p className="mt-3 max-w-[300px] text-[15.5px] leading-relaxed text-[#5f6488] sm:text-[17px]">Use sua conta institucional do Google para continuar.</p>

            {message && (
              <p
                role={message.tone === "error" ? "alert" : "status"}
                className={
                  message.tone === "error"
                    ? "mt-6 w-full rounded-2xl border border-[#f3c6cf] bg-[#fff1f3] px-4 py-3 text-[14px] font-semibold text-[#a3213f]"
                    : "mt-6 w-full rounded-2xl border border-[#d9d1f5] bg-[#f1ecfb] px-4 py-3 text-[14px] font-semibold text-[#4a2d91]"
                }
              >
                {message.text}
              </p>
            )}

            <a
              href={href}
              className="mt-8 flex h-[58px] w-full items-center justify-center gap-4 rounded-[16px] border border-[#ddd7f1] bg-white text-[16.5px] font-extrabold text-navy shadow-[0_6px_18px_rgb(76_56_170/0.08)] transition hover:-translate-y-px hover:border-[#c9bff0] hover:shadow-[0_10px_26px_rgb(76_56_170/0.14)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6a3fd6]/30 active:translate-y-0 sm:h-[62px] sm:text-[17px]"
            >
              <GoogleMark />
              Continuar com o Google
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
