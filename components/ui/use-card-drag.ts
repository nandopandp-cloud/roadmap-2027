"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Arrastar e soltar cards entre colunas, com pointer events (mouse, caneta e toque).
 *
 * Marcação esperada: cada coluna tem `data-drop-zone="<chave>"` (e `data-drop-grid`
 * quando os cards ficam em grade); cada card tem `data-drag-card="<id>"`.
 * No toque, o arraste começa com um toque longo, para não bloquear a rolagem.
 */

/** Coluna e posição entre os cards visíveis da coluna, sem contar o card arrastado. */
export interface DropTarget {
  zone: string;
  index: number;
}

export interface ActiveDrag {
  id: string;
  x: number;
  y: number;
  /** Ponto em que o card foi pego, relativo ao canto do card. */
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  origin: DropTarget;
  /** Onde o card será solto; fora de qualquer coluna, volta à origem. */
  target: DropTarget;
  /** O ponteiro está sobre uma coluna. */
  over: boolean;
}

const MOUSE_THRESHOLD = 5;
const TOUCH_DELAY = 350;
const TOUCH_TOLERANCE = 8;
const SCROLL_EDGE = 72;
const ZONE_SLACK = 40;

function zoneAt(x: number, y: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestDistance = ZONE_SLACK;
  for (const el of document.querySelectorAll<HTMLElement>("[data-drop-zone]")) {
    const r = el.getBoundingClientRect();
    const distance = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
    if (distance < bestDistance) {
      best = el;
      bestDistance = distance;
    }
  }
  return best;
}

/** Índice de inserção: em lista, pela metade vertical; em grade, pela ordem de leitura. */
function indexIn(zone: HTMLElement, x: number, y: number, dragId: string): number {
  const grid = zone.hasAttribute("data-drop-grid");
  const cards = [...zone.querySelectorAll<HTMLElement>("[data-drag-card]")].filter((el) => el.dataset.dragCard !== dragId);
  for (let n = 0; n < cards.length; n++) {
    const r = cards[n].getBoundingClientRect();
    if (grid ? y < r.top || (y <= r.bottom && x < r.left + r.width / 2) : y < r.top + r.height / 2) return n;
  }
  return cards.length;
}

function scrollParent(el: HTMLElement): HTMLElement {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return document.scrollingElement as HTMLElement;
}

export function useCardDrag({
  enabled,
  onDrop,
}: {
  enabled: boolean;
  onDrop: (id: string, target: DropTarget, origin: DropTarget) => void;
}) {
  const [drag, setDrag] = useState<ActiveDrag | null>(null);
  const dragRef = useRef<ActiveDrag | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  });
  useEffect(() => () => cancelRef.current?.(), []);

  const update = (next: ActiveDrag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const onPointerDown = useCallback(
    (id: string, e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || cancelRef.current || (e.pointerType === "mouse" && e.button !== 0)) return;
      const card = e.currentTarget.closest<HTMLElement>("[data-drag-card]");
      const zone = card?.closest<HTMLElement>("[data-drop-zone]");
      if (!card || !zone) return;

      const pointerId = e.pointerId;
      const touch = e.pointerType === "touch";
      const start = { x: e.clientX, y: e.clientY };
      const scroller = scrollParent(card);
      let pointer = start;
      let active = false;
      let finished = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let frame = 0;

      const retarget = () => {
        const current = dragRef.current;
        if (!current) return;
        const over = zoneAt(pointer.x, pointer.y);
        const target = over ? { zone: over.dataset.dropZone ?? "", index: indexIn(over, pointer.x, pointer.y, id) } : current.origin;
        update({ ...current, x: pointer.x, y: pointer.y, target, over: !!over });
      };

      const autoScroll = () => {
        const r = scroller.getBoundingClientRect();
        const top = Math.max(r.top, 0);
        const bottom = Math.min(r.bottom, window.innerHeight);
        const delta =
          pointer.y < top + SCROLL_EDGE
            ? -Math.ceil((top + SCROLL_EDGE - pointer.y) / 5)
            : pointer.y > bottom - SCROLL_EDGE
              ? Math.ceil((pointer.y - bottom + SCROLL_EDGE) / 5)
              : 0;
        if (delta) {
          scroller.scrollTop += delta;
          retarget();
        }
        frame = requestAnimationFrame(autoScroll);
      };

      const activate = () => {
        const rect = card.getBoundingClientRect();
        const origin = { zone: zone.dataset.dropZone ?? "", index: [...zone.querySelectorAll("[data-drag-card]")].indexOf(card) };
        active = true;
        window.getSelection()?.removeAllRanges();
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
        update({
          id,
          x: pointer.x,
          y: pointer.y,
          offsetX: start.x - rect.left,
          offsetY: start.y - rect.top,
          width: rect.width,
          height: rect.height,
          origin,
          target: origin,
          over: true,
        });
        frame = requestAnimationFrame(autoScroll);
      };

      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId || (touch && active)) return;
        pointer = { x: ev.clientX, y: ev.clientY };
        if (active) return retarget();
        const distance = Math.hypot(pointer.x - start.x, pointer.y - start.y);
        if (touch && distance > TOUCH_TOLERANCE) finish(false);
        else if (!touch && distance > MOUSE_THRESHOLD) activate();
      };
      const up = (ev: PointerEvent) => ev.pointerId === pointerId && finish(true);
      // No toque, o navegador cancela o ponteiro ao primeiro movimento; o arraste segue pelos eventos de toque.
      const cancel = (ev: PointerEvent) => ev.pointerId === pointerId && !(touch && active) && finish(false);
      const key = (ev: KeyboardEvent) => {
        if (ev.key !== "Escape" || !active) return;
        ev.preventDefault();
        ev.stopPropagation();
        finish(false);
      };
      // Durante o arraste por toque, o dedo move o card em vez de rolar a página.
      const touchMove = (ev: TouchEvent) => {
        if (!active || !ev.touches[0]) return;
        ev.preventDefault();
        pointer = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
        retarget();
      };
      const touchEnd = (ev: TouchEvent) => active && finish(ev.type === "touchend");
      const contextMenu = (ev: Event) => ev.preventDefault();

      function finish(drop: boolean) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        window.removeEventListener("keydown", key, true);
        window.removeEventListener("touchmove", touchMove);
        window.removeEventListener("touchend", touchEnd);
        window.removeEventListener("touchcancel", touchEnd);
        window.removeEventListener("contextmenu", contextMenu);
        cancelRef.current = null;
        const current = dragRef.current;
        if (!active) return;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        update(null);
        // O clique que encerra o arraste não deve abrir a iniciativa.
        const swallow = (ev: Event) => ev.stopPropagation();
        window.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
        if (drop && current) onDropRef.current(id, current.target, current.origin);
      }

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      window.addEventListener("keydown", key, true);
      if (touch) {
        window.addEventListener("touchmove", touchMove, { passive: false });
        window.addEventListener("touchend", touchEnd);
        window.addEventListener("touchcancel", touchEnd);
        window.addEventListener("contextmenu", contextMenu);
        timer = setTimeout(activate, TOUCH_DELAY);
      }
      cancelRef.current = () => finish(false);
    },
    [enabled],
  );

  return { drag, onPointerDown };
}
