import { useCallback, useEffect, useRef } from "react";
import { BarChart3, ChevronLeft, ChevronRight, Download, LayoutGrid, Printer } from "lucide-react";
import type { PresentationSlide } from "../../services/reportsApi";
import { ToolbarButton } from "../../components/ScreenToolbar";
import { PresentationConsolidatedSlideContent } from "./PresentationConsolidatedSlideContent";
import { exportSlideDeckCsv, printPresentationView } from "./presentationExportUtils";

const METRIC_LABELS: Record<string, string> = {
  completedKeyResults: "KRs completados",
  inProgressKeyResults: "KRs en progreso",
  totalProjects: "Iniciativas vinculadas",
};

const SLIDE_TYPE_LABELS: Record<string, string> = {
  COVER: "Portada",
  STRATEGIC_BET: "Apuesta estratégica",
  CLOSING: "Cierre",
};

function slideTypeLabel(type: string) {
  if (type.startsWith("CONSOLIDATED_")) return "Informe consolidado";
  return SLIDE_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

const METRIC_COLORS = ["#5454E9", "#4CB979", "#E9683B"];

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

  const cover = slide.type === "COVER";
  return (
    <div
      className={`mt-4 grid w-full grid-cols-1 gap-3 ${
        cover ? "mx-auto max-w-3xl sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"
      }`}
    >
      {metrics.map((metric, index) => (
        <article
          key={metric.key}
          className={`rounded-md border border-[#D9DEE8] bg-white p-3 sm:p-4 shadow-[0_1px_2px_rgba(17,24,39,0.05)] ${cover ? "text-center" : ""}`}
          style={{ borderTop: `3px solid ${METRIC_COLORS[index % METRIC_COLORS.length]}` }}
        >
          <strong className="block text-2xl sm:text-[1.75rem] font-black leading-tight text-[#111827]">{displayValue(metric.value)}</strong>
          <span className="mt-1 block text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#717182]">{metric.label}</span>
        </article>
      ))}
      {metrics.length === 0 && (
        <article className="rounded-md border border-[#D9DEE8] bg-white p-3 sm:col-span-2 xl:col-span-3">
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
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.06em] ${
                  currentSlide.type.startsWith("CONSOLIDATED_") ? "text-[#2F855A]" : "text-[#5454E9]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${currentSlide.type.startsWith("CONSOLIDATED_") ? "bg-[#4CB979]" : "bg-[#5454E9]"}`}
                  aria-hidden="true"
                />
                {slideTypeLabel(currentSlide.type)}
              </span>
              <span className="rounded-full border border-[#D9DEE8] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-extrabold text-[#717182]">
                Periodo {periodName}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sgp-screen-only">
              <ToolbarButton
                onClick={() =>
                  printPresentationView(currentSlide.title || "Presentación Institucional", {
                    subtitle: `${periodName} - Diapositiva ${currentIndex + 1} de ${slides.length}`,
                    printableSelector: ".presentation-slide-print-area",
                  })
                }
                aria-label="Exportar diapositiva actual a PDF"
                title="Exportar diapositiva actual a PDF"
              >
                <Printer size={14} aria-hidden="true" /> <span className="hidden sm:inline">PDF Diapo</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => exportSlideDeckCsv(slides, periodName)}
                aria-label="Descargar estructura de diapositivas en CSV"
                title="Descargar estructura de diapositivas en CSV"
              >
                <Download size={14} aria-hidden="true" /> <span className="hidden sm:inline">CSV Diapos</span>
              </ToolbarButton>
              <ToolbarButton onClick={onBackToHub} aria-label="Volver a Opciones" title="Volver a Opciones">
                <LayoutGrid size={14} aria-hidden="true" /> <span className="hidden sm:inline">Volver a Opciones</span>
              </ToolbarButton>
            </div>
          </div>

          <h1
            className={`max-w-4xl text-xl sm:text-2xl lg:text-[1.75rem] font-black leading-snug text-[#111827] ${
              currentSlide.type === "COVER" ? "mx-auto mt-6 text-center sm:mt-10" : ""
            }`}
          >
            {currentSlide.title}
          </h1>
          <p
            className={`mt-0.5 max-w-3xl text-xs sm:text-sm font-semibold text-[#717182] line-clamp-2 ${
              currentSlide.type === "COVER" ? "mx-auto text-center" : ""
            }`}
          >
            {currentSlide.subtitle}
          </p>
          <SlideContent slide={currentSlide} />
        </div>
      </section>

      {/* Fixed bottombar footer controls */}
      <footer className="z-20 shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-2 sm:px-6 sgp-screen-only">
        <div className="mx-auto flex max-w-5xl items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={previous}
            disabled={currentIndex === 0}
            aria-label="Diapositiva anterior"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-[#D9DEE8] bg-white text-[#374151] hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] disabled:cursor-not-allowed disabled:opacity-35 transition-colors"
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
              className="h-2 overflow-hidden rounded-full bg-[#E9ECF2]"
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
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md bg-[#5454E9] text-white hover:bg-[#4343d6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 transition-colors"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}
