import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, RefreshCw, Target } from "lucide-react";
import { RouteLoading } from "../components/RouteLoading";
import type { Goal, StrategicBet } from "../services/strategicApi";
import { loadPresentationScreen, type PresentationScreenData } from "../services/screenDataCache";
import { PresentationComparison } from "./presentation/PresentationComparison";
import { PresentationDetailModal } from "./presentation/PresentationDetailModal";
import { PresentationGeneralReport } from "./presentation/PresentationGeneralReport";
import { PresentationHeader } from "./presentation/PresentationHeader";
import { PresentationSlideDeck } from "./presentation/PresentationSlideDeck";
import type { PresentationMode } from "./presentation/PresentationTypes";
import { attachBetKeyResults, buildConsolidatedSlides, insertGoalSlides } from "./presentation/PresentationConsolidatedBuilder";
import { buildExportItems, type ComparisonExportSnapshot } from "./presentation/presentationExportItems";
import { isButtonActivation, isTextEntry, normalizeKeyboardKey, resolveSlideShortcut } from "./presentation/presentationKeyboard";
import { useAutoHideControls } from "./presentation/useAutoHideControls";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar la presentación";
}

export function PresentacionDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = (searchParams.get("modo") || searchParams.get("view")) as PresentationMode;

  const [activeMode, setActiveMode] = useState<PresentationMode>(
    initialMode === "slides" || initialMode === "compare" ? initialMode : "general"
  );

  const requestId = useRef(0);
  const comparisonExportRef = useRef<ComparisonExportSnapshot | null>(null);
  const [data, setData] = useState<PresentationScreenData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const [overviewOpen, setOverviewOpen] = useState(false);
  const presenting = activeMode === "slides";
  const { visible: controlsVisible } = useAutoHideControls({ enabled: presenting && !overviewOpen });

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

  const effectiveBets = useMemo(() => data?.bets ?? [], [data?.bets]);
  const effectiveGoals = useMemo(() => data?.goals ?? [], [data?.goals]);

  // Combined slides: COVER -> consolidated report slides -> bet slides from the API -> goal slides
  const slides = useMemo(() => {
    const baseSlides = data?.presentation.slides ?? [];
    if (!data) return baseSlides;

    const consolidatedSlides = buildConsolidatedSlides(data.consolidatedReport, periodValue);

    const coverSlide = baseSlides.find((s) => s.type === "COVER");
    const otherSlides = insertGoalSlides(
      attachBetKeyResults(baseSlides.filter((s) => s.type !== "COVER"), data.consolidatedReport),
      data.goals ?? [],
      data.consolidatedReport,
    );

    const combined = coverSlide
      ? [coverSlide, ...consolidatedSlides, ...otherSlides]
      : [...consolidatedSlides, ...otherSlides];

    return combined.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));
  }, [data, periodValue]);

  const controls = data?.presentation.controls;
  const lastIndex = Math.max(slides.length - 1, 0);

  const nextSlide = useCallback(() => setCurrentIndex((idx) => Math.min(idx + 1, lastIndex)), [lastIndex]);
  const prevSlide = useCallback(() => setCurrentIndex((idx) => Math.max(idx - 1, 0)), []);

  const canFullscreen = Boolean(controls?.fullscreenEnabled) && typeof document.documentElement.requestFullscreen === "function";

  const toggleFullscreen = useCallback(async () => {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError("El navegador no permitió activar la pantalla completa.");
    }
  }, []);

  // Leaving Presentar closes its layers and gives the screen back.
  useEffect(() => {
    if (presenting) return;
    setOverviewOpen(false);
    if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [presenting]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextEntry(event.target)) return;
      const key = normalizeKeyboardKey(event.key);
      if (isButtonActivation(event.target, key)) return;

      if (key === "Escape") {
        // The open detail dialog already handled this Escape and closed itself.
        if (event.defaultPrevented) return;
        if (overviewOpen) {
          setOverviewOpen(false);
          return;
        }
        if (selectedEntity) {
          setSelectedEntity(null);
          return;
        }
        if (activeMode !== "general") {
          setActiveMode("general");
          return;
        }
        if (!document.fullscreenElement) navigate("/dashboard");
        return;
      }

      if (!presenting || slides.length === 0) return;
      const shortcut = resolveSlideShortcut(event, { controls, overviewOpen, canFullscreen });
      if (!shortcut) return;
      event.preventDefault();
      if (shortcut === "next") nextSlide();
      else if (shortcut === "previous") prevSlide();
      else if (shortcut === "first") setCurrentIndex(0);
      else if (shortcut === "last") setCurrentIndex(lastIndex);
      else if (shortcut === "overview") setOverviewOpen((open) => !open);
      else void toggleFullscreen();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeMode, canFullscreen, controls, lastIndex, navigate, nextSlide, overviewOpen, presenting, prevSlide, selectedEntity, slides.length, toggleFullscreen]);

  const getExportItems = () =>
    buildExportItems({
      mode: activeMode,
      periodName: periodValue,
      bets: effectiveBets,
      goals: effectiveGoals,
      slides,
      currentIndex,
      comparison: comparisonExportRef.current,
    });

  if (loading) {
    return <RouteLoading label="Cargando presentación" detail="Preparando los datos del periodo" fullScreen />;
  }

  if (error) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#F8FAFC] p-6">
        <section role="alert" className="w-full max-w-md rounded-xl border border-[#F3A6A6] bg-white p-8 text-center shadow-lg">
          <Target className="mx-auto mb-4 text-[#D14343]" size={38} aria-hidden="true" />
          <h1 className="text-xl font-black text-[#111827]">No pudimos abrir la presentación</h1>
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
      <main className="grid min-h-[100dvh] place-items-center bg-[#F8FAFC] p-6 text-center">
        <section className="rounded-xl border border-[#D9DEE8] bg-white p-8 shadow-sm">
          <Target className="mx-auto mb-4 text-[#9CA3AF]" size={44} aria-hidden="true" />
          <h1 className="text-2xl font-black text-[#111827]">No hay datos para este periodo</h1>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#D9DEE8] bg-white px-5 py-3 text-sm font-extrabold text-[#111827] hover:bg-[#F8FAFC]"
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
      } flex-col bg-[#F8FAFC] text-[#111827]`}
    >
      <PresentationHeader
        title={data.presentation.title || "Modo Presentación Estratégica MSP"}
        activeMode={activeMode}
        immersive={presenting}
        concealed={presenting && !controlsVisible && !overviewOpen}
        periodValue={periodValue}
        periods={sortedPeriods}
        onBack={() => navigate("/dashboard")}
        onModeChange={setActiveMode}
        onPeriodChange={(period) => {
          setSelectedPeriod(period);
          void load(period, true);
        }}
        getExportItems={getExportItems}
      />

      {fullscreenError && (
        <p role="alert" className="shrink-0 bg-[#FFF4E5] px-6 py-2 text-center text-xs font-bold text-[#8A4B08]">
          {fullscreenError}
        </p>
      )}

      {/* Main View Area */}
      <div
        className={`presentation-print-container flex-1 min-h-0 flex flex-col ${
          presenting ? "type-scale-exempt overflow-hidden print:overflow-visible" : ""
        }`}
      >
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
            exportRef={comparisonExportRef}
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
            fullscreen={fullscreen}
            onToggleFullscreen={canFullscreen ? () => void toggleFullscreen() : undefined}
            controlsVisible={controlsVisible}
            overviewOpen={overviewOpen}
            onToggleOverview={() => setOverviewOpen((open) => !open)}
            onExit={() => setActiveMode("general")}
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
