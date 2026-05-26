import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  FileText,
  Flag,
  Gauge,
  Layers3,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { IcesiLogo } from "../components/IcesiLogo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useGlobalFilters } from "../context/FiltersContext";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { Goal, ObjectiveCard } from "../services/strategicApi";
import { loadPresentationScreen } from "../services/screenDataCache";
import {
  PERIOD_REGEX,
  type PresentationResponse,
  type PresentationSlide,
} from "../services/reportsApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  purple: "#7C3AED",
  gray: "#717182",
  text: "#111827",
  ink: "#1F2A44",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
  bg: "#F8FAFC",
};

const AUTO_REFRESH_MS = 90000;
const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;
const cardHoverMotion = { y: -2, transition: { duration: 0.12, ease: "easeOut" } } as const;

type DeckSlideType = PresentationSlide["type"] | "GOAL";
type DeckSlide = Omit<PresentationSlide, "type"> & {
  type: DeckSlideType;
  parentTitle?: string;
};

type ObjectiveSummary = {
  objectives: number;
  keyResults: number;
  averageObjectiveCoverage: string;
  lowCompletionObjectives: number;
  departments: number;
  completedKeyResults: number;
  inProgressKeyResults: number;
};

type ObjectiveSummaries = {
  betById: Map<number, ObjectiveSummary>;
  betByName: Map<string, ObjectiveSummary>;
  goalById: Map<number, ObjectiveSummary>;
  goalByName: Map<string, ObjectiveSummary>;
};

const METRIC_LABELS: Record<string, string> = {
  activeProjects: "Proyectos activos",
  completedObjectives: "Objetivos completados",
  completedProjects: "Proyectos cerrados",
  coverage: "Cobertura",
  coveragePercentage: "Cobertura",
  goals: "Metas",
  keyResults: "Resultados clave",
  linkedProjects: "Proyectos vinculados",
  objectives: "Objetivos",
  progress: "Avance",
  strategicBets: "Apuestas estrategicas",
  totalKeyResults: "Resultados clave",
  totalObjectives: "Objetivos",
  totalProjects: "Proyectos",
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

function cleanText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || fallback;
}

function clampText(value: unknown, max = 120) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const sliced = text.slice(0, max).trim();
  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > 42 ? lastSpace : max).trim()}...`;
}

function formatLabel(key: string) {
  if (METRIC_LABELS[key]) return METRIC_LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function isNoiseKey(key: string) {
  return /generated|timestamp|created|updated|source|period|institution/i.test(key);
}

function objectEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>);
}

function formatDateText(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || !/\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "string") return clampText(formatDateText(value) ?? value, 58);
  if (Array.isArray(value)) return String(value.length);
  return "";
}

function getScalarEntries(content: Record<string, unknown>) {
  const summaryEntries = objectEntries(content.executionSummary).filter(([key, value]) =>
    key !== "summaryText" && !isNoiseKey(key) && value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );
  const contentEntries = objectEntries(content).filter(([key, value]) =>
    !isNoiseKey(key) && value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );
  const numericSummary = summaryEntries.filter(([, value]) => typeof value === "number" || typeof value === "boolean" || /%$/.test(String(value)));
  const numericContent = contentEntries.filter(([, value]) => typeof value === "number" || typeof value === "boolean" || /%$/.test(String(value)));
  return (numericSummary.length ? numericSummary : numericContent.length ? numericContent : summaryEntries.length ? summaryEntries : contentEntries)
    .slice(0, 7);
}

function getSummaryText(content: Record<string, unknown>) {
  const fromExecution = objectEntries(content.executionSummary).find(([key]) => key === "summaryText")?.[1];
  if (typeof fromExecution === "string" && fromExecution.trim()) return fromExecution;
  const textEntry = objectEntries(content).find(([key, value]) =>
    !isNoiseKey(key) && typeof value === "string" && value.trim().length > 68,
  );
  return typeof textEntry?.[1] === "string" ? textEntry[1] : "";
}

function getSlideSubject(slide: DeckSlide) {
  if (slide.type === "COVER") return "Panorama institucional";
  if (slide.type === "CLOSING") return "Sintesis ejecutiva";
  if (slide.type === "GOAL") return slide.title;
  const values = [
    ...objectEntries(slide.content),
    ...objectEntries(slide.content.executionSummary),
  ];
  const found = values.find(([key, value]) =>
    /strategic.*bet.*name|bet.*name|apuesta|goal.*name|meta|name|title/i.test(key) && typeof value === "string" && value.trim(),
  );
  return typeof found?.[1] === "string" ? found[1] : slide.title;
}

function buildNarrative(slide: DeckSlide) {
  const explicit = getSummaryText(slide.content);
  if (explicit) return explicit;
  const subject = getSlideSubject(slide);
  const metrics = getScalarEntries(slide.content).slice(0, 3);
  if (!metrics.length) {
    return `Esta diapositiva resume el estado de ${clampText(subject, 90)} y orienta la conversacion hacia avances, brechas y decisiones pendientes.`;
  }
  return `El corte de ${clampText(subject, 90)} presenta ${metrics.map(([key, value]) => `${formatLabel(key).toLowerCase()} en ${formatValue(value)}`).join(", ")}. Estos datos sirven como punto de partida para priorizar seguimiento ejecutivo.`;
}

function getArrayInsights(content: Record<string, unknown>) {
  return objectEntries(content)
    .filter(([key, value]) => !isNoiseKey(key) && Array.isArray(value) && value.length > 0)
    .flatMap(([key, value]) => {
      const items = value as unknown[];
      return items.slice(0, 5).map((item, index) => {
        if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
          return { key: `${key}-${index}`, label: formatLabel(key), value: clampText(item, 120) };
        }
        const entries = objectEntries(item);
        if (!entries.length) return null;
        const title = entries.find(([entryKey]) => /name|title|nombre|titulo|objective|apuesta|meta/i.test(entryKey))?.[1] ?? entries[0]?.[1];
        const detail = entries.find(([entryKey]) => /coverage|progress|avance|porcentaje|total|count|kr|project/i.test(entryKey))?.[1] ?? entries[1]?.[1];
        return {
          key: `${key}-${index}`,
          label: formatLabel(key),
          value: `${clampText(title, 86)}${detail ? ` - ${formatValue(detail)}` : ""}`,
        };
      }).filter(Boolean) as Array<{ key: string; label: string; value: string }>;
    })
    .slice(0, 6);
}

function getDetailEntries(content: Record<string, unknown>) {
  const scalarDetails = objectEntries(content).filter(([key, value]) =>
    key !== "executionSummary" && !isNoiseKey(key) && value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );
  return scalarDetails.slice(0, 6).map(([key, value]) => ({
    key,
    label: formatLabel(key),
    value: formatValue(value),
  }));
}

function getSlideAccent(type: DeckSlideType, index: number) {
  if (type === "COVER") return COLORS.blue;
  if (type === "CLOSING") return COLORS.green;
  if (type === "GOAL") return [COLORS.orange, COLORS.green, COLORS.blue, COLORS.yellow][index % 4];
  return [COLORS.green, COLORS.orange, COLORS.blue, COLORS.yellow][index % 4];
}

function getSlideTypeLabel(type: DeckSlideType) {
  return {
    COVER: "Apertura",
    STRATEGIC_BET: "Apuesta estrategica",
    GOAL: "Meta institucional",
    CLOSING: "Cierre",
  }[type];
}

function getMetricIcon(index: number) {
  return [Gauge, Target, BarChart3, Layers3, Flag, Compass, Sparkles][index % 7];
}

function getDeckStats(slides: DeckSlide[]) {
  const strategicSlides = slides.filter((slide) => slide.type === "STRATEGIC_BET").length;
  const goalSlides = slides.filter((slide) => slide.type === "GOAL").length;
  return [
    { label: "Diapositivas", value: slides.length, color: COLORS.blue, icon: FileText },
    { label: "Apuestas", value: strategicSlides, color: COLORS.green, icon: Flag },
    { label: "Metas", value: goalSlides, color: COLORS.orange, icon: Target },
  ];
}

function isGoalArrayKey(key: string) {
  return /goals|goalList|metas|meta/i.test(key);
}

function goalTitleFromRecord(record: Record<string, unknown>, fallback: string) {
  const title = objectEntries(record).find(([key, value]) =>
    /goal.*name|meta.*name|name|title|nombre|titulo/i.test(key) && typeof value === "string" && value.trim(),
  )?.[1];
  return typeof title === "string" ? title : fallback;
}

function goalSubtitleFromRecord(record: Record<string, unknown>, parentTitle: string) {
  const subtitle = objectEntries(record).find(([key, value]) =>
    /description|summary|detalle|descripcion/i.test(key) && typeof value === "string" && value.trim(),
  )?.[1];
  return typeof subtitle === "string" ? subtitle : `Meta vinculada a ${parentTitle}.`;
}

function extractGoalSlides(slide: PresentationSlide) {
  if (slide.type !== "STRATEGIC_BET") return [];
  const parentTitle = getSlideSubject(slide as DeckSlide);
  const goalRecords = objectEntries(slide.content)
    .filter(([key, value]) => Array.isArray(value) && (isGoalArrayKey(key) || (value as unknown[]).some((item) => objectEntries(item).some(([entryKey]) => /goal|meta/i.test(entryKey)))))
    .flatMap(([, value]) => (value as unknown[]))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));

  return goalRecords.map((record, index): DeckSlide => ({
    order: slide.order + ((index + 1) / 100),
    type: "GOAL",
    title: goalTitleFromRecord(record, `Meta ${index + 1}`),
    subtitle: goalSubtitleFromRecord(record, parentTitle),
    content: {
      ...record,
      parentStrategicBet: parentTitle,
      executionSummary: typeof record.executionSummary === "object" && record.executionSummary ? record.executionSummary : {
        summaryText: goalSubtitleFromRecord(record, parentTitle),
      },
    },
    parentTitle,
  }));
}

function normalizeTitle(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function emptyObjectiveSummary(): ObjectiveSummary {
  return {
    objectives: 0,
    keyResults: 0,
    averageObjectiveCoverage: "0%",
    lowCompletionObjectives: 0,
    departments: 0,
    completedKeyResults: 0,
    inProgressKeyResults: 0,
  };
}

function summarizeCards(cards: ObjectiveCard[]): ObjectiveSummary {
  if (!cards.length) return emptyObjectiveSummary();
  const keyResults = cards.reduce((sum, card) => sum + card.keyResults.length, 0);
  const completedKeyResults = cards.reduce((sum, card) => sum + card.keyResults.filter((kr) => kr.progressPercentage >= 100).length, 0);
  const coverage = cards.reduce((sum, card) => sum + card.completionPercentage, 0) / cards.length;
  return {
    objectives: cards.length,
    keyResults,
    averageObjectiveCoverage: `${Math.round(coverage)}%`,
    lowCompletionObjectives: cards.filter((card) => card.lowCompletionAlert || card.completionPercentage < 40).length,
    departments: new Set(cards.map((card) => card.departmentId)).size,
    completedKeyResults,
    inProgressKeyResults: Math.max(0, keyResults - completedKeyResults),
  };
}

function buildObjectiveSummaries(cards: ObjectiveCard[]): ObjectiveSummaries {
  const betGroupsById = new Map<number, ObjectiveCard[]>();
  const goalGroupsById = new Map<number, ObjectiveCard[]>();

  cards.forEach((card) => {
    betGroupsById.set(card.strategicBetId, [...(betGroupsById.get(card.strategicBetId) ?? []), card]);
    goalGroupsById.set(card.goalId, [...(goalGroupsById.get(card.goalId) ?? []), card]);
  });

  const betById = new Map<number, ObjectiveSummary>();
  const betByName = new Map<string, ObjectiveSummary>();
  betGroupsById.forEach((items, id) => {
    const summary = summarizeCards(items);
    betById.set(id, summary);
    const name = items[0]?.strategicBetName;
    if (name) betByName.set(normalizeTitle(name), summary);
  });

  const goalById = new Map<number, ObjectiveSummary>();
  const goalByName = new Map<string, ObjectiveSummary>();
  goalGroupsById.forEach((items, id) => {
    const summary = summarizeCards(items);
    goalById.set(id, summary);
    const name = items[0]?.goalName;
    if (name) goalByName.set(normalizeTitle(name), summary);
  });

  return { betById, betByName, goalById, goalByName };
}

function findNumberValue(content: Record<string, unknown>, patterns: RegExp[]) {
  const values = [...objectEntries(content), ...objectEntries(content.executionSummary)];
  const found = values.find(([key, value]) => patterns.some((pattern) => pattern.test(key)) && typeof value === "number");
  return typeof found?.[1] === "number" ? found[1] : null;
}

function findSummaryForSlide(slide: DeckSlide, summaries: ObjectiveSummaries) {
  const subject = normalizeTitle(getSlideSubject(slide));
  if (slide.type === "GOAL") {
    const goalId = findNumberValue(slide.content, [/^id$/i, /goalId/i, /metaId/i]);
    return (goalId ? summaries.goalById.get(goalId) : undefined) ?? summaries.goalByName.get(subject) ?? null;
  }
  if (slide.type === "STRATEGIC_BET") {
    const betId = findNumberValue(slide.content, [/strategicBetId/i, /betId/i, /apuestaId/i]);
    return (betId ? summaries.betById.get(betId) : undefined) ?? summaries.betByName.get(subject) ?? null;
  }
  return null;
}

function enrichSlideWithSummary(slide: DeckSlide, summaries: ObjectiveSummaries): DeckSlide {
  const summary = findSummaryForSlide(slide, summaries);
  if (!summary) return slide;
  return {
    ...slide,
    content: {
      ...slide.content,
      ...summary,
      executionSummary: {
        ...(typeof slide.content.executionSummary === "object" && slide.content.executionSummary ? slide.content.executionSummary : {}),
        ...summary,
      },
    },
  };
}

function goalToDeckSlide(goal: Goal, index: number, summaries: ObjectiveSummaries): DeckSlide {
  const summary = summaries.goalById.get(goal.id) ?? summaries.goalByName.get(normalizeTitle(goal.name)) ?? emptyObjectiveSummary();
  return {
    order: 9000 + index,
    type: "GOAL",
    title: goal.name,
    subtitle: goal.description,
    content: {
      id: goal.id,
      name: goal.name,
      description: goal.description,
      referenceIndicator: goal.referenceIndicator,
      expectedValue: goal.expectedValue,
      measurementUnitName: goal.measurementUnitName,
      status: goal.status,
      startDate: goal.startDate,
      endDate: goal.endDate,
      ...summary,
      executionSummary: {
        ...goal.executionSummary,
        ...summary,
      },
    },
  };
}

function buildDeckSlides(slides: PresentationSlide[], goals: Goal[] = [], objectiveCards: ObjectiveCard[] = []): DeckSlide[] {
  const summaries = buildObjectiveSummaries(objectiveCards);
  const expanded = slides.flatMap((slide) => [
    slide as DeckSlide,
    ...extractGoalSlides(slide),
  ]).map((slide) => enrichSlideWithSummary(slide, summaries));
  const knownGoalTitles = new Set(
    expanded
      .filter((slide) => slide.type === "GOAL")
      .map((slide) => normalizeTitle(slide.title)),
  );
  const missingGoalSlides = goals
    .filter((goal) => !knownGoalTitles.has(normalizeTitle(goal.name)))
    .map((goal, index) => goalToDeckSlide(goal, index, summaries));
  if (!missingGoalSlides.length) return expanded;

  const firstClosingIndex = expanded.findIndex((slide) => slide.type === "CLOSING");
  if (firstClosingIndex === -1) return [...expanded, ...missingGoalSlides];
  return [
    ...expanded.slice(0, firstClosingIndex),
    ...missingGoalSlides,
    ...expanded.slice(firstClosingIndex),
  ];
}

const noOverflowText: CSSProperties = {
  overflowWrap: "break-word",
  wordBreak: "normal",
  hyphens: "manual",
};

const lineClampThree: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
  overflow: "hidden",
};

const lineClampTwo: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

function PageMotion({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
      transition={shortMotionTransition}
    >
      {children}
    </motion.div>
  );
}

export function PresentacionDashboard() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const { filters, setFilter } = useGlobalFilters();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectiveCards, setObjectiveCards] = useState<ObjectiveCard[]>([]);
  const [period, setPeriod] = useState(filters.periodo === "todos" ? "" : filters.periodo);
  const [data, setData] = useState<PresentationResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );
  const sourceSlides = data?.slides ?? [];
  const slides = useMemo(() => buildDeckSlides(sourceSlides, goals, objectiveCards), [goals, objectiveCards, sourceSlides]);
  const slide = slides[index] ?? null;
  const deckStats = useMemo(() => getDeckStats(slides), [slides]);
  const progress = slides.length ? ((index + 1) / slides.length) * 100 : 0;
  const updatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const loadPresentation = useCallback(async (silent = false, options?: { force?: boolean }) => {
    if (!validatePeriod(period)) {
      setError("El periodo debe tener formato YYYY-Q1..Q4 o YYYY-1..2.");
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const screen = await loadPresentationScreen(period || undefined, { force: options?.force });
      setPeriods(screen.periods);
      setGoals(screen.goals);
      setObjectiveCards(screen.objectiveCards);
      setData(screen.presentation);
      setLastUpdatedAt(new Date());
      setIndex((current) => Math.min(current, Math.max(0, buildDeckSlides(screen.presentation.slides, screen.goals, screen.objectiveCards).length - 1)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    setIndex(0);
    void loadPresentation();
  }, [loadPresentation]);

  useEffect(() => {
    if (!data) return undefined;
    const timer = window.setInterval(() => {
      void loadPresentation(true, { force: true });
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [data, loadPresentation]);

  const goToSlide = useCallback((nextIndex: number) => {
    setIndex(Math.max(0, Math.min(nextIndex, Math.max(0, slides.length - 1))));
  }, [slides.length]);

  const goNext = useCallback(() => goToSlide(index + 1), [goToSlide, index]);
  const goPrev = useCallback(() => goToSlide(index - 1), [goToSlide, index]);

  const handlePeriodChange = (value: string) => {
    const next = value === "__active" ? "" : value;
    setPeriod(next);
    setFilter("periodo", next || "todos");
  };

  const toggleFullscreen = async () => {
    if (!data?.controls.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else {
        await rootRef.current?.requestFullscreen?.();
      }
    } catch {
      setError("El navegador bloqueo la pantalla completa.");
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
        navigate("/dashboard");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [data, goNext, goPrev, navigate]);

  return (
    <div ref={rootRef} className="flex h-screen overflow-hidden bg-[#F8FAFC]" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <PresentationRail
        current={index}
        deckStats={deckStats}
        onBack={() => navigate("/dashboard")}
        onGo={goToSlide}
        period={data?.period ?? null}
        progress={progress}
        slides={slides}
      />

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PresentationHeader
          isFullscreen={isFullscreen}
          loading={loading}
          onBack={() => navigate("/dashboard")}
          onNext={goNext}
          onPeriodChange={handlePeriodChange}
          onPrev={goPrev}
          onReload={() => void loadPresentation(false, { force: true })}
          onToggleFullscreen={toggleFullscreen}
          periods={sortedPeriods}
          selectedPeriod={period}
          title={data?.title ?? "Modo presentacion"}
          updatedLabel={updatedLabel}
          canNext={index < slides.length - 1}
          canPrev={index > 0}
          fullscreenEnabled={Boolean(data?.controls.fullscreenEnabled)}
        />

        <div className="flex-1 overflow-hidden px-5 py-4">
          {error && (
            <PageMotion>
              <div className="mb-5 flex items-center gap-2 rounded-md px-4 py-3" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 800 }}>
                <RefreshCw size={15} /> {error}
              </div>
            </PageMotion>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {loading && !data ? (
              <DeckState key="loading" type="loading" message="Cargando modo presentacion..." />
            ) : slide ? (
              <SlideWorkspace
                key={`${slide.order}-${index}`}
                current={index}
                onGo={goToSlide}
                period={data?.period ?? null}
                slide={slide}
                slides={slides}
                total={slides.length}
              />
            ) : (
              <DeckState key="empty" type="empty" message="No hay diapositivas para el periodo seleccionado." />
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function PresentationRail({
  current,
  deckStats,
  onBack,
  onGo,
  period,
  progress,
  slides,
}: {
  current: number;
  deckStats: Array<{ label: string; value: number; color: string; icon: typeof FileText }>;
  onBack: () => void;
  onGo: (index: number) => void;
  period: string | null;
  progress: number;
  slides: DeckSlide[];
}) {
  return (
    <aside className="hidden w-[292px] shrink-0 flex-col bg-white xl:flex" style={{ borderRight: `1px solid ${COLORS.border}` }}>
      <div className="flex h-16 items-center justify-between px-5" style={{ backgroundColor: COLORS.blue }}>
        <IcesiLogo variant="white" size="md" />
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", color: "#fff" }} title="Volver al dashboard">
          <ArrowLeft size={15} />
        </button>
      </div>

      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <p style={{ color: COLORS.gray, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>MTE - Escuela TDI</p>
        <h1 style={{ color: COLORS.text, fontSize: 18, fontWeight: 950, lineHeight: 1.08, marginTop: 5 }}>Modo presentacion</h1>
        <p style={{ color: COLORS.gray, fontSize: 11, lineHeight: 1.4, marginTop: 7 }}>
          Lectura ejecutiva del portafolio estrategico para comites y seguimiento institucional.
        </p>
      </div>

      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between gap-3">
          <span style={{ color: COLORS.gray, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Avance del recorrido</span>
          <span style={{ color: COLORS.text, fontSize: 11, fontWeight: 900 }}>{Math.round(progress)}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#EEF2F7" }}>
          <div style={{ width: `${progress}%`, height: "100%", backgroundColor: COLORS.green }} />
        </div>
        <div className="mt-3 flex items-center gap-2" style={{ color: COLORS.gray, fontSize: 11, fontWeight: 800 }}>
          <CalendarDays size={13} />
          {period ?? "Periodo activo"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        {deckStats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between gap-3 rounded-md p-3" style={{ backgroundColor: COLORS.subtle, border: `1px solid ${COLORS.border}` }}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${stat.color}16`, color: stat.color, border: `1px solid ${stat.color}30` }}>
                <stat.icon size={14} />
              </span>
              <span style={{ color: COLORS.text, fontSize: 11, fontWeight: 850 }}>{stat.label}</span>
            </div>
            <span style={{ color: stat.color, fontSize: 15, fontWeight: 950 }}>{stat.value}</span>
          </div>
        ))}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          {slides.map((slide, index) => {
            const active = index === current;
            const accent = getSlideAccent(slide.type, index);
            return (
              <button
                key={`${slide.order}-${index}`}
                onClick={() => onGo(index)}
                className="group flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors"
                style={{
                  backgroundColor: active ? `${accent}12` : "#fff",
                  border: `1px solid ${active ? accent : COLORS.border}`,
                  boxShadow: active ? "0 1px 2px rgba(17,24,39,0.06)" : "none",
                }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: active ? accent : COLORS.subtle, color: active ? "#fff" : accent, border: `1px solid ${active ? accent : `${accent}34`}`, fontSize: 10, fontWeight: 950 }}>
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span style={{ color: active ? accent : COLORS.gray, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>
                    {getSlideTypeLabel(slide.type)}
                  </span>
                  <span style={{ ...noOverflowText, ...lineClampThree, color: COLORS.text, fontSize: 11, fontWeight: 850, lineHeight: 1.28, marginTop: 3 }}>
                    {slide.title}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

function PresentationHeader({
  canNext,
  canPrev,
  fullscreenEnabled,
  isFullscreen,
  loading,
  onBack,
  onNext,
  onPeriodChange,
  onPrev,
  onReload,
  onToggleFullscreen,
  periods,
  selectedPeriod,
  title,
  updatedLabel,
}: {
  canNext: boolean;
  canPrev: boolean;
  fullscreenEnabled: boolean;
  isFullscreen: boolean;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onPeriodChange: (value: string) => void;
  onPrev: () => void;
  onReload: () => void;
  onToggleFullscreen: () => void;
  periods: AcademicPeriod[];
  selectedPeriod: string;
  title: string;
  updatedLabel: string;
}) {
  return (
    <header className="shrink-0 bg-white px-5 py-3" style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p style={{ color: COLORS.green, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Centro ejecutivo</p>
          <h2 style={{ ...noOverflowText, color: COLORS.text, fontSize: 18, fontWeight: 950, lineHeight: 1.15, marginTop: 3 }}>
            {title}
          </h2>
          <p className="hidden md:block" style={{ color: COLORS.gray, fontSize: 10, marginTop: 4 }}>
            Modo presentacion conectado a reportes y filtros institucionales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <IconButton onClick={onBack} title="Volver al dashboard">
            <ArrowLeft size={15} />
          </IconButton>
          <Select value={selectedPeriod || "__active"} onValueChange={onPeriodChange}>
            <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="z-[10000] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
              <SelectItem value="__active" className={selectItemClass}>Periodo activo</SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.name} className={selectItemClass}>{period.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <InfoPill icon={<Clock3 size={13} />} label={updatedLabel} />

          <IconButton onClick={onReload} disabled={loading} title="Recargar">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </IconButton>
          <IconButton onClick={onToggleFullscreen} disabled={!fullscreenEnabled} title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </IconButton>
          <NavButton onClick={onPrev} disabled={!canPrev}>
            <ChevronLeft size={14} /> Anterior
          </NavButton>
          <NavButton onClick={onNext} disabled={!canNext} solid>
            Siguiente <ChevronRight size={14} />
          </NavButton>
        </div>
      </div>
    </header>
  );
}

function SlideWorkspace({
  current,
  onGo,
  period,
  slide,
  slides,
  total,
}: {
  current: number;
  onGo: (index: number) => void;
  period: string | null;
  slide: DeckSlide;
  slides: DeckSlide[];
  total: number;
}) {
  const accent = getSlideAccent(slide.type, current);
  const subject = getSlideSubject(slide);
  const narrative = buildNarrative(slide);
  const metrics = getScalarEntries(slide.content);
  const insights = getArrayInsights(slide.content);
  const details = getDetailEntries(slide.content);

  return (
    <PageMotion className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
      <SlideHero
        accent={accent}
        current={current}
        period={period}
        slide={slide}
        subject={subject}
        total={total}
      />

      <MetricGrid accent={accent} metrics={metrics} subject={subject} />

      <main className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.12fr)_340px]">
        <div className="grid min-h-0 grid-rows-[minmax(0,0.85fr)_minmax(0,1fr)] gap-3">
          <NarrativePanel accent={accent} text={narrative} />
          <DetailPanel accent={accent} details={details} />
        </div>
        <div className="min-h-0">
          <InsightPanel accent={accent} details={details} insights={insights} />
        </div>
      </main>
    </PageMotion>
  );
}

function SlideHero({
  accent,
  current,
  period,
  slide,
  subject,
  total,
}: {
  accent: string;
  current: number;
  period: string | null;
  slide: DeckSlide;
  subject: string;
  total: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className="relative overflow-hidden rounded-md bg-white p-4"
      style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...shortMotionTransition, delay: 0.02 }}
    >
      <div aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: accent }} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md px-3 py-1.5" style={{ backgroundColor: `${accent}14`, border: `1px solid ${accent}32`, color: accent, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
              <Play size={12} />
              {getSlideTypeLabel(slide.type)}
            </span>
            <span className="rounded-md px-3 py-1.5" style={{ backgroundColor: COLORS.subtle, border: `1px solid ${COLORS.border}`, color: COLORS.gray, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
              {period ?? "Periodo activo"}
            </span>
          </div>

          <h1 style={{ ...noOverflowText, color: COLORS.ink, fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 950, lineHeight: 1.03, maxWidth: 980 }}>
            {clampText(slide.title, 110)}
          </h1>
          {slide.subtitle && (
            <p style={{ ...noOverflowText, ...lineClampTwo, color: COLORS.gray, fontSize: 12, fontWeight: 650, lineHeight: 1.35, marginTop: 8, maxWidth: 920 }}>
              {clampText(slide.subtitle, 170)}
            </p>
          )}
        </div>

        <div className="grid min-w-[190px] gap-2">
          <MiniHeroStat color={accent} label="Diapositiva" value={`${current + 1}/${total}`} />
          <MiniHeroStat color={COLORS.green} label="Foco" value={clampText(subject, 42)} />
        </div>
      </div>
    </motion.section>
  );
}

function MetricGrid({ accent, metrics, subject }: { accent: string; metrics: [string, unknown][]; subject: string }) {
  const normalized = metrics.length ? metrics.slice(0, 4) : [["foco", subject] as [string, unknown]];
  const colors = [accent, COLORS.green, COLORS.orange, COLORS.blue];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {normalized.map(([key, value], index) => {
        const Icon = getMetricIcon(index);
        const color = colors[index % colors.length];
        return (
          <SolidMetricCard
            key={`${key}-${index}`}
            color={color}
            icon={<Icon size={18} />}
            index={index}
            label={formatLabel(key)}
            value={formatValue(value)}
          />
        );
      })}
    </div>
  );
}

function SolidMetricCard({
  color,
  icon,
  index,
  label,
  value,
}: {
  color: string;
  icon: ReactNode;
  index: number;
  label: string;
  value: string;
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const darkText = color === COLORS.yellow;
  const foreground = hovered ? color : darkText ? COLORS.text : "#fff";
  const muted = hovered ? COLORS.gray : darkText ? "rgba(17,24,39,0.72)" : "rgba(255,255,255,0.82)";

  return (
    <motion.div
      className="rounded-md p-3"
      style={{
        backgroundColor: hovered ? "#fff" : color,
        border: `1px solid ${color}`,
        boxShadow: hovered ? "0 14px 30px rgba(17,24,39,0.12)" : `0 10px 22px ${color}2A`,
        minHeight: 98,
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...shortMotionTransition, delay: Math.min(index * 0.025, 0.1) }}
      whileHover={reduceMotion ? undefined : cardHoverMotion}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: hovered ? `${color}16` : "rgba(255,255,255,0.16)", border: `1px solid ${hovered ? `${color}30` : "rgba(255,255,255,0.32)"}`, color: foreground }}>
          {icon}
        </div>
        <span style={{ width: 30, height: 5, borderRadius: 99, backgroundColor: hovered ? color : darkText ? "rgba(17,24,39,0.42)" : "rgba(255,255,255,0.72)" }} />
      </div>
      <p style={{ ...noOverflowText, color: foreground, fontSize: 22, fontWeight: 950, lineHeight: 1.05, marginTop: 10 }}>
        {value}
      </p>
      <p style={{ ...lineClampTwo, color: muted, fontSize: 10, fontWeight: 850, lineHeight: 1.25, marginTop: 5 }}>{label}</p>
    </motion.div>
  );
}

function NarrativePanel({ accent, text }: { accent: string; text: string }) {
  return (
    <Panel title="Lectura ejecutiva" subtitle="Sintesis para abrir conversacion y tomar decisiones." icon={<Compass size={16} />} accent={accent} delay={0.08}>
      <p style={{ ...noOverflowText, color: COLORS.text, fontSize: 15, fontWeight: 700, lineHeight: 1.58 }}>
        {clampText(text, 520)}
      </p>
    </Panel>
  );
}

function DetailPanel({ accent, details }: { accent: string; details: Array<{ key: string; label: string; value: string }> }) {
  return (
    <Panel title="Detalle estructurado" subtitle="Campos principales incluidos en esta diapositiva." icon={<Layers3 size={16} />} accent={accent} delay={0.16}>
      {details.length ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {details.slice(0, 4).map((item, index) => (
            <SolidDataTile
              key={item.key}
              color={[accent, COLORS.green, COLORS.orange, COLORS.blue][index % 4]}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
      ) : (
        <EmptyState text="Sin detalle adicional para esta diapositiva." compact />
      )}
    </Panel>
  );
}

function InsightPanel({
  accent,
  details,
  insights,
}: {
  accent: string;
  details: Array<{ key: string; label: string; value: string }>;
  insights: Array<{ key: string; label: string; value: string }>;
}) {
  const entries = insights.length ? insights : details.slice(0, 5);
  return (
    <Panel title="Puntos clave" subtitle="Elementos listos para lectura rapida." icon={<Sparkles size={16} />} accent={accent} delay={0.24}>
      {entries.length ? (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <SolidInsightRow
              key={entry.key}
              color={[accent, COLORS.green, COLORS.orange, COLORS.blue][index % 4]}
              index={index}
              label={entry.label}
              value={entry.value}
            />
          ))}
        </div>
      ) : (
        <EmptyState text="Sin puntos clave para esta diapositiva." compact />
      )}
    </Panel>
  );
}

function Panel({ title, subtitle, icon, accent, children, delay = 0 }: { title: string; subtitle: string; icon: ReactNode; accent: string; children: ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-md bg-white p-3"
      style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...shortMotionTransition, delay }}
    >
      <div className="mb-3 flex shrink-0 items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${accent}16`, color: accent, border: `1px solid ${accent}30` }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.text, lineHeight: 1.15 }}>{title}</h2>
          <p style={{ ...lineClampTwo, fontSize: 11, color: COLORS.gray, marginTop: 3, lineHeight: 1.3 }}>{subtitle}</p>
        </div>
      </div>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </motion.section>
  );
}

function SolidDataTile({ color, label, value }: { color: string; label: string; value: string }) {
  const [hovered, setHovered] = useState(false);
  const darkText = color === COLORS.yellow;
  const foreground = hovered ? color : darkText ? COLORS.text : "#fff";
  const muted = hovered ? COLORS.gray : darkText ? "rgba(17,24,39,0.68)" : "rgba(255,255,255,0.78)";

  return (
    <motion.div
      className="rounded-md p-2.5"
      style={{ backgroundColor: hovered ? "#fff" : color, border: `1px solid ${color}`, minHeight: 70 }}
      whileHover={cardHoverMotion}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{ color: muted, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
      <p style={{ ...noOverflowText, ...lineClampTwo, color: foreground, fontSize: 12, fontWeight: 850, lineHeight: 1.3, marginTop: 5 }}>{value}</p>
    </motion.div>
  );
}

function SolidInsightRow({ color, index, label, value }: { color: string; index: number; label: string; value: string }) {
  const [hovered, setHovered] = useState(false);
  const darkText = color === COLORS.yellow;
  const foreground = hovered ? color : darkText ? COLORS.text : "#fff";
  const muted = hovered ? COLORS.gray : darkText ? "rgba(17,24,39,0.7)" : "rgba(255,255,255,0.78)";

  return (
    <motion.div
      className="flex items-start gap-2 rounded-md p-2.5"
      style={{ backgroundColor: hovered ? "#fff" : color, border: `1px solid ${color}` }}
      whileHover={cardHoverMotion}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: hovered ? `${color}16` : "rgba(255,255,255,0.18)", border: `1px solid ${hovered ? `${color}30` : "rgba(255,255,255,0.32)"}`, color: foreground, fontSize: 10, fontWeight: 950 }}>
        {index + 1}
      </span>
      <div className="min-w-0">
        <p style={{ color: muted, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
        <p style={{ ...noOverflowText, ...lineClampTwo, color: foreground, fontSize: 11.5, fontWeight: 800, lineHeight: 1.28, marginTop: 2 }}>{value}</p>
      </div>
    </motion.div>
  );
}

function MiniHeroStat({ color, label, value }: { color: string; label: string; value: string }) {
  const [hovered, setHovered] = useState(false);
  const darkText = color === COLORS.yellow;
  const foreground = hovered ? color : darkText ? COLORS.text : "#fff";
  const muted = hovered ? COLORS.gray : darkText ? "rgba(17,24,39,0.7)" : "rgba(255,255,255,0.8)";
  return (
    <motion.div
      className="rounded-md p-3"
      style={{
        backgroundColor: hovered ? "#fff" : color,
        border: `1px solid ${color}`,
        boxShadow: hovered ? "0 12px 24px rgba(17,24,39,0.11)" : `0 8px 18px ${color}24`,
      }}
      whileHover={cardHoverMotion}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{ color: muted, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
      <p style={{ ...noOverflowText, ...lineClampTwo, color: foreground, fontSize: 12, fontWeight: 900, lineHeight: 1.25, marginTop: 5 }}>{value}</p>
    </motion.div>
  );
}

function InfoPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="hidden items-center gap-1.5 rounded-md px-2.5 py-2 md:flex" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.gray, fontSize: 11, fontWeight: 800 }}>
      {icon}
      {label}
    </div>
  );
}

function IconButton({ children, disabled, onClick, title }: { children: ReactNode; disabled?: boolean; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center rounded-md transition-opacity disabled:opacity-40"
      style={{ width: 38, height: 38, border: "1px solid #E5E7EB", backgroundColor: "#fff", color: COLORS.text }}
      title={title}
    >
      {children}
    </button>
  );
}

function NavButton({ children, disabled, onClick, solid = false }: { children: ReactNode; disabled?: boolean; onClick: () => void; solid?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-md px-3 transition-opacity disabled:opacity-40"
      style={{
        backgroundColor: solid ? COLORS.blue : "#fff",
        border: `1px solid ${solid ? COLORS.blue : COLORS.border}`,
        color: solid ? "#fff" : COLORS.text,
        fontSize: 12,
        fontWeight: 850,
        boxShadow: solid ? `0 10px 22px ${COLORS.blue}30` : "0 1px 2px rgba(17,24,39,0.05)",
      }}
    >
      {children}
    </button>
  );
}

function DeckState({ type, message }: { type: "loading" | "empty"; message: string }) {
  const color = type === "loading" ? COLORS.blue : COLORS.green;
  return (
    <PageMotion className="flex min-h-[460px] items-center justify-center">
      <div className="w-full max-w-[520px] rounded-md bg-white p-7 text-center" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
        <div className="mb-5 flex justify-center">
          <IcesiLogo size="md" />
        </div>
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md" style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}36` }}>
          {type === "loading" ? <Loader2 size={19} className="animate-spin" /> : <Sparkles size={18} />}
        </div>
        <p style={{ color: COLORS.ink, fontSize: 16, fontWeight: 900, lineHeight: 1.35 }}>{message}</p>
      </div>
    </PageMotion>
  );
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className="flex items-center justify-center rounded-md text-center" style={{ minHeight: compact ? 110 : 220, backgroundColor: COLORS.subtle, border: `1px dashed ${COLORS.border}`, color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
      {text}
    </div>
  );
}

const selectItemClass = "rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]";

const selectControlStyle: CSSProperties = {
  width: 190,
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: COLORS.subtle,
  color: COLORS.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};
