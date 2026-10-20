"use client";

import { FlipHorizontal2, FlipVertical2, ImagePlus, RotateCcw, RotateCw, Undo2, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/client/cn";
import type { CustomImage } from "@/lib/domain/types";

type Transform = Pick<CustomImage, "zoom" | "rotation" | "flipX" | "flipY" | "x" | "y">;
const INITIAL: Transform = { zoom: 1, rotation: 0, flipX: false, flipY: false, x: 0, y: 0 };

const PREVIEW = 320; // px do quadro de edição
const OUTPUT = 800; // px do recorte final
const ORIGINAL_MAX = 1600; // maior lado da cópia original guardada para reedição
const MAX_FILE = 15 * 1024 * 1024;

/**
 * Desenha a imagem no quadro quadrado. Posição (x, y) é uma fração do lado do quadro, então o
 * recorte final (800 px) reproduz exatamente o que o usuário vê na prévia (320 px).
 */
function paint(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, size: number, t: Transform) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const cover = Math.max(size / img.width, size / img.height);
  const scale = cover * t.zoom;
  ctx.save();
  ctx.translate(size / 2 + t.x * size, size / 2 + t.y * size);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.scale(t.flipX ? -1 : 1, t.flipY ? -1 : 1);
  ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
  ctx.restore();
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem."))), "image/jpeg", quality));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
    img.src = src;
  });
}

async function upload(blob: Blob): Promise<string> {
  const response = await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: blob });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Não foi possível enviar a imagem.");
  return body.id as string;
}

/** Editor: escolher arquivo, mover, ampliar, girar, espelhar e recortar (quadro 1:1). */
export function ImageEditor({
  current,
  onApply,
  onClose,
  title = "Imagem da iniciativa",
  description = "Envie uma imagem e ajuste o enquadramento. O resultado é um quadrado, usado na lista e no cabeçalho dos detalhes.",
}: {
  current: CustomImage | null;
  onApply: (image: CustomImage) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  const notify = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fromFile, setFromFile] = useState<File | null>(null);
  const [t, setT] = useState<Transform>(current ?? INITIAL);
  const [loading, setLoading] = useState(!!current);
  const [saving, setSaving] = useState(false);

  // Reedição: carrega a cópia original guardada.
  useEffect(() => {
    if (!current) return;
    let alive = true;
    loadImage(`/api/images/${current.originalId}`)
      .then((i) => alive && setImg(i))
      .catch(() => alive && notify("error", "Não foi possível carregar a imagem original. Envie o arquivo novamente."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [current, notify]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !img) return;
    paint(ctx, img, PREVIEW, t);
  }, [img, t]);

  const patch = useCallback((p: Partial<Transform>) => setT((prev) => ({ ...prev, ...p })), []);

  async function pickFile(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return notify("error", "Use uma imagem JPG, PNG, WebP ou GIF.");
    if (file.size > MAX_FILE) return notify("error", "A imagem é grande demais (máximo de 15 MB).");
    const url = URL.createObjectURL(file);
    try {
      setImg(await loadImage(url));
      setFromFile(file);
      setT(INITIAL);
    } catch {
      notify("error", "Não foi possível abrir essa imagem.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, startX: t.x, startY: t.y };
  }
  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const d = drag.current;
    if (!d) return;
    const box = e.currentTarget.getBoundingClientRect().width;
    patch({ x: clamp(d.startX + (e.clientX - d.x) / box, -2, 2), y: clamp(d.startY + (e.clientY - d.y) / box, -2, 2) });
  }
  function onKeyDown(e: KeyboardEvent<HTMLCanvasElement>) {
    const step = e.shiftKey ? 0.1 : 0.02;
    const moves: Record<string, Partial<Transform>> = {
      ArrowLeft: { x: clamp(t.x - step, -2, 2) },
      ArrowRight: { x: clamp(t.x + step, -2, 2) },
      ArrowUp: { y: clamp(t.y - step, -2, 2) },
      ArrowDown: { y: clamp(t.y + step, -2, 2) },
    };
    if (moves[e.key]) {
      e.preventDefault();
      patch(moves[e.key]);
    }
  }

  async function apply() {
    if (!img || saving) return;
    setSaving(true);
    try {
      const out = document.createElement("canvas");
      out.width = out.height = OUTPUT;
      paint(out.getContext("2d")!, img, OUTPUT, t);
      const imageId = await upload(await toBlob(out, 0.88));

      // Cópia original (reduzida) para permitir reedição; reaproveita a existente quando não houve novo arquivo.
      let originalId = current?.originalId;
      if (fromFile || !originalId) {
        const ratio = Math.min(1, ORIGINAL_MAX / Math.max(img.width, img.height));
        const orig = document.createElement("canvas");
        orig.width = Math.round(img.width * ratio);
        orig.height = Math.round(img.height * ratio);
        const octx = orig.getContext("2d")!;
        octx.fillStyle = "#ffffff";
        octx.fillRect(0, 0, orig.width, orig.height);
        octx.drawImage(img, 0, 0, orig.width, orig.height);
        originalId = await upload(await toBlob(orig, 0.9));
      }
      onApply({ imageId, originalId, ...t });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Não foi possível salvar a imagem.");
    } finally {
      setSaving(false);
    }
  }

  const changed = JSON.stringify(t) !== JSON.stringify(INITIAL);
  const slider = "h-2 w-full cursor-pointer accent-[#6045d8]";
  const tool = "flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-[13px] font-bold text-ink transition-colors hover:border-line-strong disabled:opacity-40";

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} disabled={!img} onClick={apply}>
            Usar esta imagem
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
        <div className="mx-auto w-full max-w-[320px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-[repeating-conic-gradient(#f1f3f9_0%_25%,#fff_0%_50%)] bg-[length:20px_20px]">
            <canvas
              ref={canvasRef}
              width={PREVIEW}
              height={PREVIEW}
              tabIndex={img ? 0 : -1}
              role="img"
              aria-label="Prévia do recorte. Arraste, ou use as setas do teclado, para mover a imagem."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              onKeyDown={onKeyDown}
              className={cn("h-full w-full touch-none", img ? "cursor-grab active:cursor-grabbing" : "hidden")}
            />
            {img && (
              <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(to_right,transparent_33%,rgba(255,255,255,.55)_33%,rgba(255,255,255,.55)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,.55)_66%,rgba(255,255,255,.55)_calc(66%+1px),transparent_calc(66%+1px)),linear-gradient(to_bottom,transparent_33%,rgba(255,255,255,.55)_33%,rgba(255,255,255,.55)_calc(33%+1px),transparent_calc(33%+1px),transparent_66%,rgba(255,255,255,.55)_66%,rgba(255,255,255,.55)_calc(66%+1px),transparent_calc(66%+1px))]" />
            )}
            {!img && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={loading} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-[14px] font-bold text-muted hover:text-ink">
                <ImagePlus size={30} aria-hidden />
                {loading ? "Carregando imagem…" : "Escolher imagem"}
                <span className="text-[12px] font-normal">JPG, PNG, WebP ou GIF · até 15 MB</span>
              </button>
            )}
          </div>
          {img && <p className="mt-2 text-center text-[12px] text-muted">Arraste a imagem para posicioná-la.</p>}
        </div>

        <div className="flex flex-col gap-5">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ""; }} />
          <div>
            <Button size="sm" icon={<ImagePlus size={15} />} onClick={() => fileRef.current?.click()}>
              {img ? "Trocar imagem" : "Escolher imagem"}
            </Button>
          </div>

          <div className={cn("flex flex-col gap-5", !img && "pointer-events-none opacity-45")} aria-disabled={!img}>
            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between text-[13px] font-bold text-navy">
                <span className="flex items-center gap-1.5">
                  <ZoomIn size={15} aria-hidden /> Zoom
                </span>
                <span className="font-semibold text-muted">{t.zoom.toFixed(2)}×</span>
              </span>
              <input type="range" min={1} max={5} step={0.01} value={t.zoom} onChange={(e) => patch({ zoom: Number(e.target.value) })} className={slider} disabled={!img} />
            </label>

            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between text-[13px] font-bold text-navy">
                <span>Rotação</span>
                <span className="font-semibold text-muted">{Math.round(t.rotation)}°</span>
              </span>
              <input type="range" min={-180} max={180} step={1} value={t.rotation} onChange={(e) => patch({ rotation: Number(e.target.value) })} className={slider} disabled={!img} />
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" className={tool} disabled={!img} onClick={() => patch({ rotation: normalize(t.rotation - 90) })}>
                <RotateCcw size={16} aria-hidden /> Girar 90° à esquerda
              </button>
              <button type="button" className={tool} disabled={!img} onClick={() => patch({ rotation: normalize(t.rotation + 90) })}>
                <RotateCw size={16} aria-hidden /> Girar 90° à direita
              </button>
              <button type="button" className={cn(tool, t.flipX && "border-violet bg-brand-soft text-brand")} aria-pressed={t.flipX} disabled={!img} onClick={() => patch({ flipX: !t.flipX })}>
                <FlipVertical2 size={16} aria-hidden /> Espelhar horizontal
              </button>
              <button type="button" className={cn(tool, t.flipY && "border-violet bg-brand-soft text-brand")} aria-pressed={t.flipY} disabled={!img} onClick={() => patch({ flipY: !t.flipY })}>
                <FlipHorizontal2 size={16} aria-hidden /> Espelhar vertical
              </button>
            </div>

            <div>
              <Button size="sm" variant="ghost" icon={<Undo2 size={15} />} disabled={!img || !changed} onClick={() => setT(INITIAL)}>
                Redefinir ajustes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
/** Mantém a rotação entre -180° e 180° (limites do controle deslizante). */
function normalize(deg: number) {
  const r = ((((deg + 180) % 360) + 360) % 360) - 180;
  return r === -180 && deg > 0 ? 180 : r;
}
