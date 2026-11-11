import type { ReactNode } from "react";
import type { PresentationSlide } from "../../services/reportsApi";
import { PresentationConsolidatedSlideContent } from "./PresentationConsolidatedSlideContent";
import { PRESENTATION_UI } from "./PresentationLayout";
import { BetBody, ClosingBody, CoverBody, GoalBody } from "./PresentationSlideBodies";

const SLIDE_TYPE_LABELS: Record<string, string> = {
  COVER: "Portada",
  STRATEGIC_BET: "Apuesta estratégica",
  GOAL: "Meta institucional",
  CLOSING: "Cierre",
};

export function slideTypeLabel(type: string) {
  if (type.startsWith("CONSOLIDATED_")) return "Informe consolidado";
  return SLIDE_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

function RecordedContent({ slide }: { slide: PresentationSlide }) {
  if (slide.type.startsWith("CONSOLIDATED_")) return <PresentationConsolidatedSlideContent slide={slide} />;
  if (slide.type === "COVER") return <CoverBody slide={slide} />;
  if (slide.type === "STRATEGIC_BET") return <BetBody slide={slide} />;
  if (slide.type === "GOAL") return <GoalBody slide={slide} />;
  if (slide.type === "CLOSING") return <ClosingBody slide={slide} />;
  return null;
}

interface FrameProps {
  slide: PresentationSlide;
  periodName: string;
  centered?: boolean;
  children: ReactNode;
}

/** Common frame of every slide: same margins on every side, then kind, period, title and subtitle. */
export function SlideFrame({ slide, periodName, centered = false, children }: FrameProps) {
  const consolidated = slide.type.startsWith("CONSOLIDATED_");
  const accent = consolidated ? PRESENTATION_UI.green : slide.type === "GOAL" ? PRESENTATION_UI.orange : PRESENTATION_UI.blue;
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white" style={{ padding: "72px 112px", color: PRESENTATION_UI.text }}>
      <div className="flex shrink-0 items-center justify-between gap-8">
        <span className="inline-flex items-center gap-4" style={{ fontSize: 22, fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span className="rounded-full" style={{ width: 14, height: 14, backgroundColor: accent }} aria-hidden="true" />
          {slideTypeLabel(slide.type)}
        </span>
        <span className="rounded-full" style={{ fontSize: 20, fontWeight: 500, color: PRESENTATION_UI.muted, border: `2px solid ${PRESENTATION_UI.border}`, padding: "6px 22px", backgroundColor: PRESENTATION_UI.surface }}>
          Periodo {periodName}
        </span>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col ${centered ? "items-center justify-center text-center" : ""}`}>
        <div className={centered ? "" : "mt-10 shrink-0"}>
          <h1 className="line-clamp-2" title={slide.title} style={{ fontSize: centered ? 80 : 56, fontWeight: 700, lineHeight: 1.12, maxWidth: 1500 }}>{slide.title}</h1>
          {slide.subtitle && (
            <p className="line-clamp-2" title={slide.subtitle} style={{ fontSize: 26, fontWeight: 500, color: PRESENTATION_UI.muted, marginTop: 12, maxWidth: 1400, lineHeight: 1.35 }}>
              {slide.subtitle}
            </p>
          )}
        </div>
        <div className={`min-h-0 ${centered ? "mt-12" : "mt-10 flex flex-1 flex-col overflow-hidden"}`}>{children}</div>
      </div>

    </div>
  );
}

interface Props {
  slide: PresentationSlide;
  periodName: string;
}

/** One slide drawn at 1920×1080; the stage scales it to the screen. */
export function PresentationSlideView({ slide, periodName }: Props) {
  return (
    <SlideFrame slide={slide} periodName={periodName} centered={slide.type === "COVER" || slide.type === "CLOSING"}>
      {/* A new slide starts its lists on the first page. */}
      <RecordedContent key={`${slide.order}-${slide.type}-${slide.title}`} slide={slide} />
    </SlideFrame>
  );
}
