import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  BarChart2,
  Download,
  GitCompare,
  Home,
  Maximize2,
  Minimize2,
  Presentation,
  Printer,
  RefreshCw,
  Target,
} from "lucide-react";
import { RouteLoading } from "../components/RouteLoading";
import type { Goal, StrategicBet } from "../services/strategicApi";
import { loadPresentationScreen, type PresentationScreenData } from "../services/screenDataCache";
import { PresentationComparison } from "./presentation/PresentationComparison";
import { PresentationDetailModal } from "./presentation/PresentationDetailModal";
import { PresentationGeneralReport } from "./presentation/PresentationGeneralReport";
import { PresentationHub } from "./presentation/PresentationHub";
import { PresentationSlideDeck } from "./presentation/PresentationSlideDeck";
import {
  getEffectiveBets,
  getEffectiveGoals,
  type PresentationMode,
} from "./presentation/PresentationTypes";
import { buildConsolidatedSlides } from "./presentation/PresentationConsolidatedBuilder";
import { exportGeneralReportCsv, exportSlideDeckCsv, printPresentationView } from "./presentation/presentationExportUtils";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar la presentación";
}

function normalizeKeyboardKey(key: string) {
  return key === " " ? "Space" : key;
}

function isFormControl(target: EventTarget | null) {
  return target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName);
}

export function PresentacionDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = (searchParams.get("modo") || searchParams.get("view")) as PresentationMode;

  const [activeMode, setActiveMode] = useState<PresentationMode>(
    initialMode === "slides" || initialMode === "general" || initialMode === "compare" ? initialMode : "hub"
  );

  const requestId = useRef(0);
  const [data, setData] = useState<PresentationScreenData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");

  // Modal detail state
  const [selectedEntity, setSelectedEntity] = useState<
    { type: "bet"; data: StrategicBet } | { type: "goal"; data: Goal } | null
  >(null);

  const load = useCallback(async (period?: string, force = false) => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await loadPresentationScreen(period, { force });
      if (id !== requestId.current) return;
      setData(result);
      setCurrentIndex(0);
    } catch (loadError) {
      if (id === requestId.current) setError(errorMessage(loadError));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const periodValue = selectedPeriod || data?.presentation.period || "";
  const sortedPeriods = useMemo(
    () => [...(data?.periods ?? [])].sort((a, b) => b.startDate?.localeCompare(a.startDate ?? "") ?? 0),
    [data?.periods]
  );

  const effectiveBets = useMemo(() => getEffectiveBets(data?.bets), [data?.bets]);
  const effectiveGoals = useMemo(() => getEffectiveGoals(data?.goals), [data?.goals]);

  // Combined slides: COVER -> 7 CONSOLIDATED SLIDES -> STRATEGIC_BETs -> CLOSING
  const slides = useMemo(() => {
    const baseSlides = data?.presentation.slides ?? [];
    if (!data) return baseSlides;

    const consolidatedSlides = buildConsolidatedSlides(
      data.consolidatedReport,
      effectiveBets,
      effectiveGoals,
      periodValue || "2026-1",
    );

    const coverSlide = baseSlides.find((s) => s.type === "COVER");
    const otherSlides = baseSlides.filter((s) => s.type !== "COVER");

    const combined = coverSlide
      ? [coverSlide, ...consolidatedSlides, ...otherSlides]
      : [...consolidatedSlides, ...otherSlides];

    return combined.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));
  }, [data, effectiveBets, effectiveGoals, periodValue]);

  const controls = data?.presentation.controls;
  const lastIndex = Math.max(slides.length - 1, 0);

  const nextSlide = useCallback(() => setCurrentIndex((idx) => Math.min(idx + 1, lastIndex)), [lastIndex]);
  const prevSlide = useCallback(() => setCurrentIndex((idx) => Math.max(idx - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isFormControl(event.target)) return;
      const key = normalizeKeyboardKey(event.key);

      if (key === "Escape") {
        if (selectedEntity) {
          setSelectedEntity(null);
          return;
        }
        if (activeMode !== "hub") {
          setActiveMode("hub");
          return;
        }
        if (!document.fullscreenElement) {
          navigate("/dashboard");
          return;
        }
      }

      if (activeMode === "slides" && controls?.keyboardNavigationEnabled && slides.length > 0) {
        if (controls.nextKeys.includes(key)) {
          event.preventDefault();
          nextSlide();
        } else if (controls.previousKeys.includes(key)) {
          event.preventDefault();
          prevSlide();
        } else if (key === "Home") {
          setCurrentIndex(0);
        } else if (key === "End") {
          setCurrentIndex(lastIndex);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeMode, controls, lastIndex, navigate, nextSlide, prevSlide, selectedEntity, slides.length]);

  const toggleFullscreen = async () => {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError("El navegador no permitió activar la pantalla completa.");
    }
  };

  if (loading) {
    return <RouteLoading label="Cargando presentación" detail="Preparando los datos del periodo" fullScreen />;
  }

  if (error) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#F7F8FC] p-6">
        <section role="alert" className="w-full max-w-md rounded-xl border border-[#F3A6A6] bg-white p-8 text-center shadow-lg">
          <Target className="mx-auto mb-4 text-[#D14343]" size={38} aria-hidden="true" />
          <h1 className="text-xl font-black text-[#222245]">No pudimos abrir la presentación</h1>
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">{error}</p>
          <button
            type="button"
            onClick={() => void load(selectedPeriod || undefined, true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#5454E9] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#4343d6]"
          >
            <RefreshCw size={16} aria-hidden="true" /> Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#F7F8FC] p-6 text-center">
        <section className="rounded-xl border border-[#DFE3EC] bg-white p-8 shadow-sm">
          <Target className="mx-auto mb-4 text-[#9CA3AF]" size={44} aria-hidden="true" />
          <h1 className="text-2xl font-black text-[#222245]">No hay datos para este periodo</h1>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#D9DEE8] bg-white px-5 py-3 text-sm font-extrabold text-[#222245] hover:bg-[#F7F8FC]"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Volver al dashboard
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`flex ${
        activeMode === "slides"
          ? "fixed inset-0 z-30 h-[100dvh] max-h-[100dvh] overflow-hidden print:relative print:h-auto print:overflow-visible"
          : "min-h-[100dvh]"
      } flex-col bg-[#F7F8FC] text-[#222245]`}
    >
      {/* Persistent Executive Header */}
      <header className="sticky top-0 z-40 shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] bg-white px-4 py-2.5 sm:px-8 shadow-xs sgp-screen-only">
        {/* Left branding and back */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            aria-label="Volver al dashboard"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#D9DEE8] bg-white text-[#222245] hover:bg-[#F7F8FC]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#4CB979]" />
              <p className="truncate text-sm font-black text-[#222245]">
                {data.presentation.title || "Modo Presentación Estratégica MSP"}
              </p>
            </div>
            <p className="text-[11px] font-bold text-[#717182]">
              {activeMode === "hub" && "Selección de Opciones"}
              {activeMode === "general" && "Opción 1: Informe General Conjunto"}
              {activeMode === "compare" && "Opción 2: Comparador de Entidades"}
              {activeMode === "slides" && `Diapositivas (${currentIndex + 1}/${slides.length})`}
            </p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <nav aria-label="Modos de presentación" className="hidden lg:flex items-center rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveMode("hub")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeMode === "hub" ? "bg-[#222245] text-white shadow-xs" : "text-[#717182] hover:text-[#222245]"
            }`}
          >
            <Home size={14} aria-hidden="true" />
            <span>Inicio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("general")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeMode === "general" ? "bg-[#5454E9] text-white shadow-xs" : "text-[#717182] hover:text-[#222245]"
            }`}
          >
            <BarChart2 size={14} aria-hidden="true" />
            <span>Opción 1: Informe General</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("compare")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeMode === "compare" ? "bg-[#4CB979] text-white shadow-xs" : "text-[#717182] hover:text-[#222245]"
            }`}
          >
            <GitCompare size={14} aria-hidden="true" />
            <span>Opción 2: Comparar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("slides")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              activeMode === "slides" ? "bg-[#222245] text-white shadow-xs" : "text-[#717182] hover:text-[#222245]"
            }`}
          >
            <Presentation size={14} aria-hidden="true" />
            <span>Diapositivas</span>
          </button>
        </nav>

        {/* Right Period and Action controls */}
        <div className="flex items-center gap-2">
          {/* Global View Export Buttons */}
          <div className="hidden sm:inline-flex items-center rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                if (activeMode === "general") {
                  printPresentationView("Informe General de Metas y Apuestas", {
                    subtitle: `Periodo ${periodValue} - Modulo de Trazabilidad Estratégica`,
                    printableSelector: ".presentation-general-print-area",
                  });
                } else if (activeMode === "compare") {
                  printPresentationView("Comparativa de Desempeño Estratégico", {
                    subtitle: `Periodo ${periodValue} - Modulo de Trazabilidad Estratégica`,
                    printableSelector: ".presentation-comparison-print-area",
                  });
                } else if (activeMode === "slides") {
                  printPresentationView(slides[currentIndex]?.title || "Presentación Institucional", {
                    subtitle: `Periodo ${periodValue} - Diapositiva ${currentIndex + 1} de ${slides.length}`,
                    printableSelector: ".presentation-slide-print-area",
                  });
                } else {
                  printPresentationView("Modo Presentación Estratégica", {
                    subtitle: `Periodo ${periodValue} - Modulo de Trazabilidad Estratégica`,
                    printableSelector: ".presentation-print-container",
                  });
                }
              }}
              title="Exportar vista activa a PDF"
              aria-label="Exportar vista activa a PDF"
              className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
            >
              <Printer size={14} className="text-[#5454E9]" aria-hidden="true" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeMode === "slides") {
                  exportSlideDeckCsv(slides, periodValue);
                } else {
                  exportGeneralReportCsv(effectiveBets, effectiveGoals, periodValue);
                }
              }}
              title="Descargar datos en CSV"
              aria-label="Descargar datos de la presentación en CSV"
              className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
            >
              <Download size={14} className="text-[#4CB979]" aria-hidden="true" />
              <span>CSV</span>
            </button>
          </div>

          <label className="sr-only" htmlFor="presentation-period">
            Periodo académico
          </label>
          <select
            id="presentation-period"
            value={periodValue}
            onChange={(event) => {
              setSelectedPeriod(event.target.value);
              void load(event.target.value, true);
            }}
            className="h-10 rounded-lg border border-[#D9DEE8] bg-white px-3 text-xs font-bold text-[#222245] shadow-xs"
          >
            {sortedPeriods.map((period) => (
              <option key={period.id} value={period.name}>
                Periodo {period.name}
              </option>
            ))}
          </select>

          {controls?.fullscreenEnabled && typeof document.documentElement.requestFullscreen === "function" && (
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              className="grid h-10 w-10 place-items-center rounded-lg bg-[#5454E9] text-white shadow-xs hover:bg-[#4343d6]"
            >
              {fullscreen ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Mode Switcher Bar */}
      <div className="lg:hidden shrink-0 flex items-center justify-between border-b border-[#DFE3EC] bg-white px-4 py-2 overflow-x-auto text-xs font-extrabold gap-2 sgp-screen-only">
        <button
          type="button"
          onClick={() => setActiveMode("hub")}
          className={`px-3 py-1.5 rounded-md shrink-0 ${activeMode === "hub" ? "bg-[#222245] text-white" : "text-[#717182]"}`}
        >
          Inicio
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("general")}
          className={`px-3 py-1.5 rounded-md shrink-0 ${activeMode === "general" ? "bg-[#5454E9] text-white" : "text-[#717182]"}`}
        >
          Opción 1: Informe
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("compare")}
          className={`px-3 py-1.5 rounded-md shrink-0 ${activeMode === "compare" ? "bg-[#4CB979] text-white" : "text-[#717182]"}`}
        >
          Opción 2: Comparar
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("slides")}
          className={`px-3 py-1.5 rounded-md shrink-0 ${activeMode === "slides" ? "bg-[#222245] text-white" : "text-[#717182]"}`}
        >
          Diapositivas
        </button>
      </div>

      {fullscreenError && (
        <p role="alert" className="shrink-0 bg-[#FFF4E5] px-6 py-2 text-center text-xs font-bold text-[#8A4B08]">
          {fullscreenError}
        </p>
      )}

      {/* Main View Area */}
      <div
        className={`presentation-print-container flex-1 min-h-0 flex flex-col ${
          activeMode === "slides" ? "overflow-hidden" : ""
        }`}
      >
        {activeMode === "hub" && (
          <PresentationHub
            periodName={periodValue}
            bets={effectiveBets}
            goals={effectiveGoals}
            onSelectOption={(option) => setActiveMode(option)}
          />
        )}

        {activeMode === "general" && (
          <PresentationGeneralReport
            bets={effectiveBets}
            goals={effectiveGoals}
            periodName={periodValue}
            onSelectBet={(b) => setSelectedEntity({ type: "bet", data: b })}
            onSelectGoal={(g) => setSelectedEntity({ type: "goal", data: g })}
          />
        )}

        {activeMode === "compare" && (
          <PresentationComparison
            bets={effectiveBets}
            goals={effectiveGoals}
            periodName={periodValue}
            periods={sortedPeriods}
            onSelectBet={(b) => setSelectedEntity({ type: "bet", data: b })}
            onSelectGoal={(g) => setSelectedEntity({ type: "goal", data: g })}
          />
        )}

        {activeMode === "slides" && (
          <PresentationSlideDeck
            slides={slides}
            currentIndex={currentIndex}
            periodName={periodValue}
            onIndexChange={(idx) => setCurrentIndex(idx)}
            onBackToHub={() => setActiveMode("hub")}
          />
        )}
      </div>

      {/* Interactive Detail Modal for clicked Bet or Goal */}
      {selectedEntity && (
        <PresentationDetailModal
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </main>
  );
}
