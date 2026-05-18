import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useGlobalFilters } from "../context/FiltersContext";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import {
  PERIOD_REGEX,
  presentationApi,
  type PresentationResponse,
  type PresentationSlide,
} from "../services/reportsApi";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  bg: "#08080D",
  surface: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.1)",
  textDim: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.38)",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar la presentacion.";
}

function validatePeriod(value: string) {
  return !value || PERIOD_REGEX.test(value);
}

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `${value.length} elementos`;
  if (typeof value === "object") return "";
  return String(value);
}

function objectEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>);
}

function SummaryCards({ content }: { content: Record<string, unknown> }) {
  const executionSummary = content.executionSummary;
  const summaryEntries = objectEntries(executionSummary).filter(([key, value]) =>
    key !== "summaryText" && typeof value !== "object",
  );
  const mainEntries = objectEntries(content).filter(([key, value]) =>
    key !== "executionSummary" && typeof value !== "object",
  );
  const entries = summaryEntries.length ? summaryEntries : mainEntries;

  if (!entries.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {entries.slice(0, 6).map(([key, value], index) => (
        <div key={key} className="rounded-xl p-5" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <p style={{ color: [COLORS.yellow, COLORS.green, COLORS.blue, COLORS.orange][index % 4], fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
            {formatValue(value)}
          </p>
          <p style={{ color: COLORS.textDim, fontSize: 11, fontWeight: 700, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {formatLabel(key)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ContentDetails({ content }: { content: Record<string, unknown> }) {
  const summaryText = objectEntries(content.executionSummary).find(([key]) => key === "summaryText")?.[1];
  const detailEntries = objectEntries(content).filter(([key, value]) =>
    key !== "executionSummary" && value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );

  return (
    <div className="space-y-4">
      {typeof summaryText === "string" && (
        <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 18, lineHeight: 1.6, maxWidth: 860 }}>
          {summaryText}
        </p>
      )}
      {detailEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {detailEntries.slice(0, 8).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg px-4 py-3" style={{ backgroundColor: "rgba(255,255,255,0.035)", border: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.textDim, fontSize: 12, fontWeight: 800 }}>{formatLabel(key)}</span>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, textAlign: "right" }}>{formatValue(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlideView({ slide, total, current, period }: { slide: PresentationSlide; total: number; current: number; period: string | null }) {
  const accent = slide.type === "COVER" ? COLORS.yellow : slide.type === "CLOSING" ? COLORS.green : COLORS.blue;

  return (
    <article className="h-full w-full overflow-hidden" style={{ background: `radial-gradient(circle at 80% 10%, ${accent}24, transparent 28%), ${COLORS.bg}` }}>
      <div className="flex h-full">
        <aside className="hidden h-full w-[32%] flex-col justify-between p-12 lg:flex" style={{ background: `linear-gradient(160deg, ${accent}28, rgba(255,255,255,0.02))`, borderRight: `1px solid ${COLORS.border}` }}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: `1px solid ${COLORS.border}` }}>
              <Sparkles size={12} color={accent} />
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Escuela TDI
              </span>
            </div>
            <div className="mt-7 flex gap-1">
              {[COLORS.yellow, COLORS.green, COLORS.orange, COLORS.blue].map((color) => (
                <span key={color} style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {slide.type.replace("_", " ")}
            </p>
            <p style={{ color: "#fff", fontSize: 68, fontWeight: 900, lineHeight: 1, marginTop: 12 }}>
              {String(current + 1).padStart(2, "0")}
            </p>
            <p style={{ color: COLORS.textDim, fontSize: 12, marginTop: 8 }}>
              de {total} diapositivas
            </p>
          </div>

          <div>
            <p style={{ color: COLORS.textMuted, fontSize: 11 }}>Periodo</p>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 900, marginTop: 3 }}>{period ?? "Activo"}</p>
          </div>
        </aside>

        <main className="flex flex-1 flex-col justify-center gap-10 p-8 md:p-14">
          <div>
            <p style={{ color: accent, fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              {period ?? "Periodo activo"}
            </p>
            <h1 style={{ color: "#fff", fontSize: slide.type === "COVER" ? 58 : 46, fontWeight: 900, lineHeight: 1.05, maxWidth: 980 }}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <h2 style={{ color: COLORS.textDim, fontSize: 20, fontWeight: 500, lineHeight: 1.45, maxWidth: 860, marginTop: 18 }}>
                {slide.subtitle}
              </h2>
            )}
          </div>

          <div className="space-y-8">
            <SummaryCards content={slide.content} />
            <ContentDetails content={slide.content} />
          </div>
        </main>
      </div>
    </article>
  );
}

function NavDots({ current, total, onGo }: { current: number; total: number; onGo: (index: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onGo(index)}
          style={{
            width: current === index ? 26 : 7,
            height: 7,
            borderRadius: 99,
            backgroundColor: current === index ? COLORS.yellow : "rgba(255,255,255,0.22)",
            transition: "all 0.2s ease",
          }}
          title={`Ir a diapositiva ${index + 1}`}
        />
      ))}
    </div>
  );
}

export function PresentacionDashboard() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { filters, setFilter } = useGlobalFilters();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [period, setPeriod] = useState(filters.periodo === "todos" ? "" : filters.periodo);
  const [data, setData] = useState<PresentationResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );

  const loadPresentation = useCallback(async () => {
    if (!validatePeriod(period)) {
      setError("El periodo debe tener formato YYYY-Q1..Q4 o YYYY-1..2.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [periodList, presentation] = await Promise.all([
        academicPeriodsApi.list(),
        presentationApi.get({ period: period || undefined }),
      ]);
      setPeriods(periodList);
      setData(presentation);
      setIndex(0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadPresentation();
  }, [loadPresentation]);

  const slides = data?.slides ?? [];
  const slide = slides[index];

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(current + 1, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(current - 1, 0));
  }, []);

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!data?.controls.keyboardNavigationEnabled) return;
      const nextKeys = new Set([...(data.controls.nextKeys ?? []), "ArrowRight", "ArrowDown", "Space"]);
      const previousKeys = new Set([...(data.controls.previousKeys ?? []), "ArrowLeft", "ArrowUp"]);
      const exitKeys = new Set([...(data.controls.exitKeys ?? []), "Escape"]);

      if (nextKeys.has(event.code)) {
        event.preventDefault();
        goNext();
      } else if (previousKeys.has(event.code)) {
        event.preventDefault();
        goPrev();
      } else if (exitKeys.has(event.code)) {
        event.preventDefault();
        exitPresentation();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [data, exitPresentation, goNext, goPrev]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!data?.controls.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else {
        await containerRef.current?.requestFullscreen?.();
      }
    } catch {
      setError("El navegador bloqueo la pantalla completa.");
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setFilter("periodo", value || "todos");
  };

  const progress = slides.length ? ((index + 1) / slides.length) * 100 : 0;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Montserrat, sans-serif",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        zIndex: 9999,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.08)", zIndex: 20 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.yellow})`, transition: "width 0.25s ease" }} />
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <div className="flex h-full items-center justify-center" style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>
            <Loader2 size={20} className="mr-2 animate-spin" /> Cargando presentacion...
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <p style={{ color: COLORS.orange, fontSize: 16, fontWeight: 900 }}>{error}</p>
            <button onClick={() => void loadPresentation()} className="flex items-center gap-2 rounded-lg" style={{ padding: "10px 14px", backgroundColor: COLORS.yellow, color: "#000", fontSize: 12, fontWeight: 900 }}>
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        ) : slide ? (
          <SlideView slide={slide} total={slides.length} current={index} period={data?.period ?? null} />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ color: COLORS.textDim, fontSize: 14, fontWeight: 900 }}>
            No hay diapositivas para el periodo seleccionado.
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-4 px-6 py-4" style={{ backgroundColor: "rgba(0,0,0,0.82)", borderTop: `1px solid ${COLORS.border}`, backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2" style={{ color: COLORS.textDim, fontSize: 12, fontWeight: 800 }}>
            <X size={14} /> Salir
          </button>
          <select value={period} onChange={(event) => handlePeriodChange(event.target.value)} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "7px 9px", fontSize: 12, fontWeight: 800, backgroundColor: "#111", color: "#fff" }}>
            <option value="">Periodo activo</option>
            {sortedPeriods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col items-center gap-2">
          <NavDots current={index} total={slides.length} onGo={setIndex} />
          <p style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {data?.title ?? "Presentacion"} - {slides.length ? index + 1 : 0}/{slides.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleFullscreen} disabled={!data?.controls.fullscreenEnabled} className="flex items-center justify-center rounded-lg disabled:opacity-40" style={{ width: 34, height: 34, backgroundColor: COLORS.surface, color: "#fff", border: `1px solid ${COLORS.border}` }} title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={goPrev} disabled={index === 0} className="flex items-center gap-1.5 rounded-lg disabled:opacity-35" style={{ padding: "8px 12px", backgroundColor: COLORS.surface, color: "#fff", border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 800 }}>
            <ChevronLeft size={14} /> Anterior
          </button>
          <button onClick={goNext} disabled={index >= slides.length - 1} className="flex items-center gap-1.5 rounded-lg disabled:opacity-35" style={{ padding: "8px 13px", backgroundColor: index >= slides.length - 1 ? COLORS.surface : COLORS.blue, color: "#fff", border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 900 }}>
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}
