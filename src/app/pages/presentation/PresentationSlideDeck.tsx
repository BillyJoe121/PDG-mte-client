import { useCallback, useEffect, useRef } from "react";
import { BarChart3, ChevronLeft, ChevronRight, Download, LayoutGrid, Printer } from "lucide-react";
import type { PresentationSlide } from "../../services/reportsApi";
import { PresentationConsolidatedSlideContent } from "./PresentationConsolidatedSlideContent";
import { exportSlideDeckCsv, printPresentationView } from "./presentationExportUtils";

const METRIC_LABELS: Record<string, string> = {
  completedObjectives: "Objetivos completados",
  inProgressObjectives: "Objetivos en progreso",
  completedKeyResults: "KRs completados",
  inProgressKeyResults: "KRs en progreso",
  totalProjects: "Proyectos vinculados",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function displayValue(value: unknown) {
  if (typeof value === "number") return new Intl.NumberFormat("es-CO").format(value);
  if (typeof value === "string") return value;
  return "—";
}

function SlideContent({ slide }: { slide: PresentationSlide }) {
  if (slide.type.startsWith("CONSOLIDATED_")) {
    return <PresentationConsolidatedSlideContent slide={slide} />;
  }

  const summary = isRecord(slide.content.executionSummary) ? slide.content.executionSummary : slide.content;
  const metrics = Object.entries(METRIC_LABELS)
    .filter(([key]) => typeof summary[key] === "number")
    .map(([key, label]) => ({ key, label, value: summary[key] }));

  if (slide.type === "CLOSING") {
    return (
      <div className="mx-auto mt-4 max-w-2xl text-center">
        <BarChart3 className="mx-auto mb-2 text-[#4CB979]" size={32} aria-hidden="true" />
        <p className="text-sm sm:text-base font-semibold leading-relaxed text-[#4B5563]">
          {displayValue(slide.content.summaryText)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric, index) => (
        <article key={metric.key} className="rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3 shadow-xs">
          <div className="mb-2 h-1 w-8 rounded-full" style={{ backgroundColor: ["#5454E9", "#4CB979", "#E4B83D"][index % 3] }} />
          <strong className="block text-xl sm:text-2xl font-black text-[#222245]">{displayValue(metric.value)}</strong>
          <span className="mt-0.5 block text-[11px] font-semibold text-[#6B7280]">{metric.label}</span>
        </article>
      ))}
      {metrics.length === 0 && (
        <article className="rounded-lg border border-[#DFE3EC] bg-white p-3 sm:col-span-2 xl:col-span-3">
          <p className="text-xs sm:text-sm font-semibold text-[#4B5563]">
            {displayValue(slide.content.summaryText ?? slide.content.institution ?? slide.content.status)}
          </p>
        </article>
      )}
    </div>
  );
}

interface Props {
  slides: PresentationSlide[];
  currentIndex: number;
  periodName: string;
  onIndexChange: (index: number) => void;
  onBackToHub: () => void;
}

export function PresentationSlideDeck({
  slides,
  currentIndex,
  periodName,
  onIndexChange,
  onBackToHub,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIndex = Math.max(slides.length - 1, 0);
  const currentSlide = slides[currentIndex];

  const next = useCallback(() => onIndexChange(Math.min(currentIndex + 1, lastIndex)), [currentIndex, lastIndex, onIndexChange]);
  const previous = useCallback(() => onIndexChange(Math.max(currentIndex - 1, 0)), [currentIndex, onIndexChange]);

  // Reset internal slide scroll position when switching slides
  useEffect(() => {
    if (typeof scrollRef.current?.scrollTo === "function") {
      scrollRef.current.scrollTo({ top: 0, behavior: "instant" });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  const progress = slides.length ? ((currentIndex + 1) / slides.length) * 100 : 0;

  if (!currentSlide) return null;

  return (
    <div className="flex flex-1 min-h-0 flex-col justify-between h-full overflow-hidden">
      {/* Slide body with internal scroll */}
      <section
        ref={scrollRef}
        className="presentation-slide-print-area flex-1 min-h-0 overflow-y-auto px-4 py-2.5 sm:px-8 sm:py-3.5 lg:px-10 app-scroll-default"
        aria-label={`Diapositiva ${currentIndex + 1} de ${slides.length}`}
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white ${
                  currentSlide.type.startsWith("CONSOLIDATED_") ? "bg-[#4CB979]" : "bg-[#5454E9]"
                }`}
              >
                {currentSlide.type.startsWith("CONSOLIDATED_")
                  ? "INFORME CONSOLIDADO"
                  : currentSlide.type.replace("_", " ")}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#717182]">
                {periodName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sgp-screen-only">
              <button
                type="button"
                onClick={() =>
                  printPresentationView(currentSlide.title || "Presentación Institucional", {
                    subtitle: `${periodName} - Diapositiva ${currentIndex + 1} de ${slides.length}`,
                    printableSelector: ".presentation-slide-print-area",
                  })
                }
                aria-label="Exportar diapositiva actual a PDF"
                className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2 py-1 text-[11px] font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
              >
                <Printer size={12} className="text-[#5454E9]" aria-hidden="true" />
                <span>PDF Diapo</span>
              </button>
              <button
                type="button"
                onClick={() => exportSlideDeckCsv(slides, periodName)}
                aria-label="Descargar estructura de diapositivas en CSV"
                className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2 py-1 text-[11px] font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
              >
                <Download size={12} className="text-[#4CB979]" aria-hidden="true" />
                <span>CSV Diapos</span>
              </button>
              <button
                type="button"
                onClick={onBackToHub}
                className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#717182] hover:bg-[#F7F8FC] hover:text-[#222245]"
              >
                <LayoutGrid size={13} aria-hidden="true" />
                <span>Volver a Opciones</span>
              </button>
            </div>
          </div>

          <h1 className="max-w-4xl text-xl sm:text-2xl lg:text-[1.75rem] font-black leading-snug text-[#222245]">
            {currentSlide.title}
          </h1>
          <p className="mt-0.5 max-w-3xl text-xs sm:text-sm font-semibold text-[#717182] line-clamp-2">
            {currentSlide.subtitle}
          </p>
          <SlideContent slide={currentSlide} />
        </div>
      </section>

      {/* Fixed bottombar footer controls */}
      <footer className="shrink-0 border-t border-[#DFE3EC] bg-white px-4 py-2 sm:px-8 sgp-screen-only shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-20">
        <div className="mx-auto flex max-w-5xl items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={previous}
            disabled={currentIndex === 0}
            aria-label="Diapositiva anterior"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#D9DEE8] bg-white text-[#222245] hover:bg-[#F7F8FC] disabled:cursor-not-allowed disabled:opacity-35 transition-colors"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between text-xs font-extrabold text-[#717182]">
              <span>
                {currentIndex + 1} / {slides.length}
              </span>
              <span className="hidden sm:inline text-[11px] font-semibold">Usa las flechas del teclado para navegar</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-[#E9ECF2]"
              role="progressbar"
              aria-label="Progreso de la presentación"
              aria-valuemin={1}
              aria-valuemax={slides.length}
              aria-valuenow={currentIndex + 1}
            >
              <div
                className="h-full rounded-full bg-[#5454E9] transition-[width] duration-200 motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={next}
            disabled={currentIndex === lastIndex}
            aria-label="Siguiente diapositiva"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#5454E9] text-white hover:bg-[#4343d6] disabled:cursor-not-allowed disabled:opacity-35 transition-colors"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}
