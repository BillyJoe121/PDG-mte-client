import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, BarChart3, ChevronLeft, ChevronRight, Maximize2, Minimize2, RefreshCw, Target } from "lucide-react";
import { RouteLoading } from "../components/RouteLoading";
import type { PresentationSlide } from "../services/reportsApi";
import { loadPresentationScreen, type PresentationScreenData } from "../services/screenDataCache";

const METRIC_LABELS: Record<string, string> = {
  completedObjectives: "Objetivos completados",
  inProgressObjectives: "Objetivos en progreso",
  completedKeyResults: "KRs completados",
  inProgressKeyResults: "KRs en progreso",
  totalProjects: "Proyectos vinculados",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar la presentación";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function displayValue(value: unknown) {
  if (typeof value === "number") return new Intl.NumberFormat("es-CO").format(value);
  if (typeof value === "string") return value;
  return "—";
}

function normalizeKeyboardKey(key: string) {
  return key === " " ? "Space" : key;
}

function isFormControl(target: EventTarget | null) {
  return target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName);
}

function SlideContent({ slide }: { slide: PresentationSlide }) {
  const summary = isRecord(slide.content.executionSummary) ? slide.content.executionSummary : slide.content;
  const metrics = Object.entries(METRIC_LABELS)
    .filter(([key]) => typeof summary[key] === "number")
    .map(([key, label]) => ({ key, label, value: summary[key] }));

  if (slide.type === "CLOSING") {
    return (
      <div className="mx-auto mt-8 max-w-3xl text-center">
        <BarChart3 className="mx-auto mb-5 text-[#4CB979]" size={48} aria-hidden="true" />
        <p className="text-xl font-semibold leading-relaxed text-[#4B5563]">
          {displayValue(slide.content.summaryText)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric, index) => (
        <article key={metric.key} className="border border-[#DFE3EC] bg-white p-5 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
          <div className="mb-4 h-1 w-12" style={{ backgroundColor: ["#5454E9", "#4CB979", "#E4B83D"][index % 3] }} />
          <strong className="block text-3xl font-black text-[#222245]">{displayValue(metric.value)}</strong>
          <span className="mt-2 block text-sm font-semibold text-[#6B7280]">{metric.label}</span>
        </article>
      ))}
      {metrics.length === 0 && (
        <article className="border border-[#DFE3EC] bg-white p-6 sm:col-span-2 xl:col-span-3">
          <p className="text-base font-semibold text-[#4B5563]">
            {displayValue(slide.content.summaryText ?? slide.content.institution ?? slide.content.status)}
          </p>
        </article>
      )}
    </div>
  );
}

export function PresentacionDashboard() {
  const navigate = useNavigate();
  const requestId = useRef(0);
  const [data, setData] = useState<PresentationScreenData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");

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
    return () => { requestId.current += 1; };
  }, [load]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const slides = data?.presentation.slides ?? [];
  const currentSlide = slides[currentIndex];
  const controls = data?.presentation.controls;
  const lastIndex = Math.max(slides.length - 1, 0);
  const next = useCallback(() => setCurrentIndex((index) => Math.min(index + 1, lastIndex)), [lastIndex]);
  const previous = useCallback(() => setCurrentIndex((index) => Math.max(index - 1, 0)), []);

  useEffect(() => {
    if (!controls?.keyboardNavigationEnabled || slides.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isFormControl(event.target)) return;
      const key = normalizeKeyboardKey(event.key);
      if (controls.nextKeys.includes(key)) {
        event.preventDefault();
        next();
      } else if (controls.previousKeys.includes(key)) {
        event.preventDefault();
        previous();
      } else if (key === "Home") setCurrentIndex(0);
      else if (key === "End") setCurrentIndex(lastIndex);
      else if (controls.exitKeys.includes(key) && !document.fullscreenElement) navigate("/dashboard");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [controls, lastIndex, navigate, next, previous, slides.length]);

  const toggleFullscreen = async () => {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError("El navegador no permitió activar la pantalla completa.");
    }
  };

  const periodValue = selectedPeriod || data?.presentation.period || "";
  const progress = slides.length ? ((currentIndex + 1) / slides.length) * 100 : 0;
  const sortedPeriods = useMemo(
    () => [...(data?.periods ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [data?.periods],
  );

  if (loading) return <RouteLoading label="Cargando presentación" detail="Preparando los datos del periodo" fullScreen />;

  if (error) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#F7F8FC] p-6">
        <section role="alert" className="w-full max-w-md border border-[#F3A6A6] bg-white p-8 text-center shadow-lg">
          <Target className="mx-auto mb-4 text-[#D14343]" size={38} aria-hidden="true" />
          <h1 className="text-xl font-black text-[#222245]">No pudimos abrir la presentación</h1>
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">{error}</p>
          <button type="button" onClick={() => void load(selectedPeriod || undefined, true)} className="mt-6 inline-flex items-center gap-2 bg-[#5454E9] px-5 py-3 text-sm font-extrabold text-white">
            <RefreshCw size={16} aria-hidden="true" /> Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (!currentSlide || !data) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#F7F8FC] p-6 text-center">
        <section>
          <Target className="mx-auto mb-4 text-[#9CA3AF]" size={44} aria-hidden="true" />
          <h1 className="text-2xl font-black text-[#222245]">No hay diapositivas para este periodo</h1>
          <button type="button" onClick={() => navigate("/dashboard")} className="mt-6 inline-flex items-center gap-2 border border-[#D9DEE8] bg-white px-5 py-3 text-sm font-extrabold text-[#222245]">
            <ArrowLeft size={16} aria-hidden="true" /> Volver al dashboard
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[#F7F8FC] text-[#222245]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] bg-white px-4 py-3 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Volver al dashboard" className="grid h-10 w-10 shrink-0 place-items-center border border-[#D9DEE8] bg-white text-[#222245]">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{data.presentation.title}</p>
            <p className="text-xs font-semibold text-[#717182]">Modo presentación</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="presentation-period">Periodo académico</label>
          <select id="presentation-period" value={periodValue} onChange={(event) => {
            setSelectedPeriod(event.target.value);
            void load(event.target.value, true);
          }} className="h-10 border border-[#D9DEE8] bg-white px-3 text-sm font-bold text-[#222245]">
            {sortedPeriods.map((period) => <option key={period.id} value={period.name}>{period.name}</option>)}
          </select>
          {controls?.fullscreenEnabled && typeof document.documentElement.requestFullscreen === "function" && (
            <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} className="grid h-10 w-10 place-items-center bg-[#5454E9] text-white">
              {fullscreen ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
            </button>
          )}
        </div>
      </header>

      {fullscreenError && <p role="alert" className="bg-[#FFF4E5] px-6 py-2 text-center text-xs font-bold text-[#8A4B08]">{fullscreenError}</p>}

      <section className="flex flex-1 items-center px-5 py-8 sm:px-10 lg:px-16" aria-label={`Diapositiva ${currentIndex + 1} de ${slides.length}`}>
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="bg-[#5454E9] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">{currentSlide.type.replace("_", " ")}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#717182]">{data.presentation.period}</span>
          </div>
          <h1 className="max-w-5xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">{currentSlide.title}</h1>
          <p className="mt-4 max-w-4xl text-base font-semibold text-[#717182] sm:text-xl">{currentSlide.subtitle}</p>
          <SlideContent slide={currentSlide} />
        </div>
      </section>

      <footer className="border-t border-[#DFE3EC] bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <button type="button" onClick={previous} disabled={currentIndex === 0} aria-label="Diapositiva anterior" className="grid h-11 w-11 shrink-0 place-items-center border border-[#D9DEE8] bg-white disabled:cursor-not-allowed disabled:opacity-35">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-[#717182]">
              <span>{currentIndex + 1} / {slides.length}</span>
              <span className="hidden sm:inline">Usa las flechas del teclado para navegar</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-[#E9ECF2]" role="progressbar" aria-label="Progreso de la presentación" aria-valuemin={1} aria-valuemax={slides.length} aria-valuenow={currentIndex + 1}>
              <div className="h-full bg-[#5454E9] transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button type="button" onClick={next} disabled={currentIndex === lastIndex} aria-label="Siguiente diapositiva" className="grid h-11 w-11 shrink-0 place-items-center bg-[#5454E9] text-white disabled:cursor-not-allowed disabled:opacity-35">
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </main>
  );
}
