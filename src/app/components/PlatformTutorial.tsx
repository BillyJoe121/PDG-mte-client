import { type KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DETAIL_BUTTON_CLASS, DETAIL_PRIMARY_BUTTON_CLASS } from "./DetailModal";
import { placeTourCard, type Size } from "./tutorial/tourPlacement";
import { tourStepsFor } from "./tutorial/tourSteps";
import { useTourTarget } from "./tutorial/useTourTarget";

const CARD_WIDTH = 300;
const SPOTLIGHT_PAD = 6;
const Z_INDEX = 1100;

interface PlatformTutorialProps {
  open: boolean;
  /** First visit: the tour cannot be closed before Finalizar. */
  mandatory?: boolean;
  /** `finished` is true when the user reached Finalizar. */
  onClose: (finished: boolean) => void;
}

/** Guided tour: a small card next to each control it explains, moving through the screens. */
export function PlatformTutorial({ open, mandatory = false, onClose }: PlatformTutorialProps) {
  const { usuario } = useAuth();
  const steps = useMemo(() => tourStepsFor(usuario), [usuario]);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const step = steps[Math.min(index, steps.length - 1)];
  const onRoute = !step?.route || pathname === step.route;
  const { ready, rect } = useTourTarget(step?.target, open && onRoute, step?.clicks, step?.keepShownTarget);

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState<Size>({ width: CARD_WIDTH, height: 180 });
  const [viewport, setViewport] = useState<Size>(() => ({ width: window.innerWidth, height: window.innerHeight }));

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (open && step?.route && pathname !== step.route) navigate(step.route);
  }, [open, step, pathname, navigate]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const { width, height } = card.getBoundingClientRect();
    if (width && height && (width !== cardSize.width || height !== cardSize.height)) setCardSize({ width, height });
  });

  useEffect(() => {
    if (open && ready) cardRef.current?.focus();
  }, [open, ready, index]);

  if (!open || !step) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const finish = () => onClose(true);
  const next = () => (isLast ? finish() : setIndex((value) => value + 1));
  const previous = () => setIndex((value) => Math.max(0, value - 1));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (!mandatory) onClose(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(cardRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const position = placeTourCard(rect, cardSize, viewport, step.placement === "side" || Boolean(step.target?.startsWith("nav-")));
  const titleId = `tour-step-title-${step.id}`;
  const bodyId = `tour-step-body-${step.id}`;
  const showCard = ready && onRoute;

  return createPortal(
    <div onKeyDown={onKeyDown} data-testid="guided-tour" data-guided-tour="">
      {/* Blocks the page so the tour is followed from the card. */}
      <div aria-hidden="true" className="fixed inset-0" style={{ zIndex: Z_INDEX, backgroundColor: rect && showCard ? "transparent" : "rgba(17, 24, 39, 0.45)" }} />
      {rect && showCard && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-lg"
          style={{
            zIndex: Z_INDEX,
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: "0 0 0 3px #E4EB60, 0 0 0 9999px rgba(17, 24, 39, 0.45)",
          }}
        />
      )}
      {showCard && (
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          tabIndex={-1}
          className="fixed rounded-lg border border-black bg-white p-4 shadow-xl outline-none"
          style={{ zIndex: Z_INDEX + 1, top: position.top, left: position.left, width: CARD_WIDTH, maxWidth: `calc(100vw - 24px)` }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#5454E9]">Paso {index + 1} de {steps.length}</p>
            {!mandatory && (
              <button type="button" onClick={() => onClose(false)} aria-label="Cerrar recorrido" className="-mr-1 -mt-1 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black">
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <h2 id={titleId} className="mt-1 text-sm font-bold text-[#111827]">{step.title}</h2>
          <p id={bodyId} className="mt-1.5 text-[13px] leading-5 text-gray-600">{step.body}</p>
          {mandatory && isFirst && <p className="mt-2 text-[11px] text-gray-500">Completa el recorrido para empezar a usar la plataforma.</p>}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div className="h-full bg-[#5454E9] transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={previous} disabled={isFirst} className={DETAIL_BUTTON_CLASS}>
              <ArrowLeft size={13} aria-hidden="true" />
              Anterior
            </button>
            <button type="button" onClick={next} className={DETAIL_PRIMARY_BUTTON_CLASS}>
              {isLast ? "Finalizar" : "Siguiente"}
              {!isLast && <ArrowRight size={13} aria-hidden="true" />}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
