import { useRef } from "react";
import type { PresentationSlide } from "../../services/reportsApi";
import { PresentationSlideView } from "./PresentationSlideView";
import { STAGE_HEIGHT, STAGE_WIDTH, useStageFit } from "./presentationStage";

interface Props {
  slide: PresentationSlide;
  index: number;
  total: number;
  periodName: string;
  /** The cursor goes away with the controls so nothing sits over the slide. */
  hideCursor: boolean;
}

/** Dark letterboxed area with the 16:9 slide scaled to the largest size that fits. */
export function PresentationStage({ slide, index, total, periodName, hideCursor }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const fit = useStageFit(frameRef);

  return (
    <div
      ref={frameRef}
      className="presentation-stage-frame absolute inset-0 overflow-hidden bg-[#111827]"
      style={{ cursor: hideCursor ? "none" : undefined }}
    >
      <section
        aria-label={`Diapositiva ${index + 1} de ${total}`}
        aria-roledescription="diapositiva"
        className="presentation-stage presentation-slide-print-area absolute overflow-hidden bg-white"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          left: fit.offsetX,
          top: fit.offsetY,
          transform: `scale(${fit.scale})`,
          transformOrigin: "top left",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div key={index} className="presentation-slide-enter h-full w-full">
          <PresentationSlideView slide={slide} periodName={periodName} />
        </div>
      </section>
      <p className="sr-only" aria-live="polite">
        {`Diapositiva ${index + 1} de ${total}: ${slide.title}`}
      </p>
    </div>
  );
}

/** Always-visible position: the count and a thin bar along the bottom edge. */
export function PresentationProgress({ index, total }: { index: number; total: number }) {
  const progress = total ? ((index + 1) / total) * 100 : 0;
  return (
    <>
      <p
        className="pointer-events-none absolute bottom-3 right-4 z-30 rounded-full px-2.5 py-1 sgp-screen-only"
        style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", backgroundColor: "rgba(17,24,39,0.6)" }}
      >
        {index + 1} / {total}
      </p>
      <div
        role="progressbar"
        aria-label="Progreso de la presentación"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-valuetext={`Diapositiva ${index + 1} de ${total}`}
        className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/15 sgp-screen-only"
      >
        <div
          className="h-full bg-[#5454E9] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}
