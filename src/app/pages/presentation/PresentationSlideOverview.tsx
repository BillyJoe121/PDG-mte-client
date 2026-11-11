import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { X } from "lucide-react";
import type { PresentationSlide } from "../../services/reportsApi";
import { PresentationSlideView } from "./PresentationSlideView";
import { STAGE_HEIGHT, STAGE_WIDTH } from "./presentationStage";

const THUMB_WIDTH = 288;
const THUMB_SCALE = THUMB_WIDTH / STAGE_WIDTH;

interface Props {
  slides: PresentationSlide[];
  currentIndex: number;
  periodName: string;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/** Grid of every slide to jump to any of them. Escape is handled by the page. */
export function PresentationSlideOverview({ slides, currentIndex, periodName, onSelect, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
    // Focus moves once, when the view opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const thumbs = focusables.filter((button) => button.dataset.thumbnail !== undefined);
    const position = thumbs.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === "Tab" && focusables.length) {
      // Keeps the keyboard inside the dialog.
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let target = -1;
    if (event.key in moves && position >= 0) target = Math.min(Math.max(position + moves[event.key], 0), thumbs.length - 1);
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = thumbs.length - 1;
    if (target < 0) return;
    event.preventDefault();
    thumbs[target]?.focus();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Vista de miniaturas"
      onKeyDown={onKeyDown}
      className="absolute inset-0 z-50 overflow-y-auto bg-[#111827]/95 px-4 pb-10 pt-6 sm:px-10 sgp-screen-only"
    >
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
          Diapositivas <span style={{ fontWeight: 700, color: "#D1D5DB" }}>({slides.length})</span>
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar miniaturas"
          title="Cerrar (Esc o G)"
          className="grid h-11 w-11 place-items-center rounded-md border border-black bg-white text-[#111827] hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-2"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <ol className="mx-auto mt-6 grid max-w-[1500px] justify-center gap-6" style={{ gridTemplateColumns: `repeat(auto-fill, ${THUMB_WIDTH}px)` }}>
        {slides.map((slide, index) => {
          const current = index === currentIndex;
          return (
            <li key={`${slide.order}-${slide.type}`}>
              <button
                type="button"
                data-thumbnail=""
                aria-label={`Ir a la diapositiva ${index + 1}: ${slide.title}`}
                aria-current={current ? "true" : undefined}
                onClick={() => onSelect(index)}
                className="group block w-full rounded-md text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#5454E9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]"
              >
                <div
                  aria-hidden="true"
                  className="relative overflow-hidden rounded-md bg-white transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none"
                  style={{
                    width: THUMB_WIDTH,
                    height: STAGE_HEIGHT * THUMB_SCALE,
                    outline: current ? "4px solid #5454E9" : "1px solid rgba(255,255,255,0.25)",
                    outlineOffset: current ? 2 : 0,
                  }}
                >
                  <div className="absolute left-0 top-0" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left" }}>
                    <PresentationSlideView slide={slide} periodName={periodName} />
                  </div>
                </div>
                <span aria-hidden="true" className="mt-2 flex gap-2" style={{ fontSize: 13, fontWeight: 750, color: current ? "#fff" : "#D1D5DB" }}>
                  <span style={{ color: current ? "#A5B4FC" : "#9CA3AF" }}>{index + 1}</span>
                  <span className="truncate">{slide.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
