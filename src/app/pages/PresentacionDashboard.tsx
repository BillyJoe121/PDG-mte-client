import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Flag,
  Layers3,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { IcesiLogo } from "../components/IcesiLogo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
  navy: "#111827",
  ink: "#1F2A44",
  bg: "#F5F7FB",
  surface: "#FFFFFF",
  surfaceMuted: "#F4F6FA",
  border: "#D9DEE8",
  text: "#111827",
  textDim: "#4B5563",
  textMuted: "#6B7280",
};

const BRAND_STRIPES = [COLORS.yellow, COLORS.green, COLORS.orange, COLORS.blue];
const AUTO_REFRESH_MS = 90000;
const METRIC_LABELS: Record<string, string> = {
  activeProjects: "Proyectos activos",
  completedObjectives: "Objetivos completados",
  completedProjects: "Proyectos cerrados",
  coveragePercentage: "Cobertura",
  coverage: "Cobertura",
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

const ease = [0.22, 1, 0.36, 1] as const;
const slideVariants = {
  enter: { opacity: 0, x: 28, scale: 0.985 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -24, scale: 0.99 },
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
  if (METRIC_LABELS[key]) return METRIC_LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || fallback;
}

function isNoiseKey(key: string) {
  return /generated|timestamp|created|updated|source|period|institution/i.test(key);
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

function clampText(value: unknown, max = 140) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const sliced = text.slice(0, max).trim();
  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > 48 ? lastSpace : max).trim()}...`;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "string") return clampText(formatDateText(value) ?? value, 54);
  if (Array.isArray(value)) return `${value.length}`;
  if (typeof value === "object") return "";
  return clampText(value, 54);
}

function objectEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>);
}

function findContentValue(content: Record<string, unknown>, patterns: RegExp[]) {
  const sources = [content, ...(objectEntries(content.executionSummary).length ? [content.executionSummary as Record<string, unknown>] : [])];
  for (const source of sources) {
    const found = objectEntries(source).find(([key, value]) =>
      typeof value === "string" && value.trim() && patterns.some((pattern) => pattern.test(key)),
    );
    if (found) return String(found[1]);
  }
  return "";
}

function getSlideSubject(slide: PresentationSlide) {
  if (slide.type === "COVER") return "Panorama institucional";
  if (slide.type === "CLOSING") return "Sintesis ejecutiva";
  return findContentValue(slide.content, [
    /strategic.*bet.*name/i,
    /bet.*name/i,
    /apuesta/i,
    /goal.*name/i,
    /meta/i,
    /name/i,
    /title/i,
  ]) || slide.title;
}

function getSlideFocusLabel(slide: PresentationSlide) {
  if (slide.type === "COVER") return "Vista general";
  if (slide.type === "CLOSING") return "Cierre";
  const hasGoal = findContentValue(slide.content, [/goal.*name/i, /meta/i]);
  return hasGoal ? "Meta institucional" : "Apuesta estrategica";
}

function getScalarEntries(content: Record<string, unknown>) {
  const executionSummary = content.executionSummary;
  const summaryEntries = objectEntries(executionSummary).filter(([key, value]) =>
    key !== "summaryText" && !isNoiseKey(key) && value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );
  const mainEntries = objectEntries(content).filter(([, value]) =>
    value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );
  const cleanMainEntries = mainEntries.filter(([key]) => !isNoiseKey(key));
  const numericSummary = summaryEntries.filter(([, value]) => typeof value === "number" || typeof value === "boolean");
  const numericMain = cleanMainEntries.filter(([, value]) => typeof value === "number" || typeof value === "boolean");
  if (numericSummary.length) return numericSummary;
  if (numericMain.length) return numericMain;
  return summaryEntries.length ? summaryEntries : cleanMainEntries;
}

function getPrimaryMetric(entries: [string, unknown][]) {
  const priority = [/coverage/i, /progress/i, /avance/i, /activeProjects/i, /strategicBets/i, /objectives/i, /keyResults/i];
  return [...entries].sort(([a], [b]) => {
    const aIndex = priority.findIndex((pattern) => pattern.test(a));
    const bIndex = priority.findIndex((pattern) => pattern.test(b));
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  })[0];
}

function getSummaryText(content: Record<string, unknown>) {
  const fromSummary = objectEntries(content.executionSummary).find(([key]) => key === "summaryText")?.[1];
  if (typeof fromSummary === "string" && fromSummary.trim()) return fromSummary;
  const firstText = objectEntries(content).find(([, value]) => typeof value === "string" && value.length > 70)?.[1];
  return typeof firstText === "string" ? firstText : "";
}

function buildExecutiveSummary(slide: PresentationSlide, subject: string) {
  const entries = getScalarEntries(slide.content);
  const primary = getPrimaryMetric(entries);
  const secondary = entries.filter(([key]) => key !== primary?.[0]).slice(0, 2);
  const primaryText = primary ? `${formatLabel(primary[0]).toLowerCase()} en ${formatValue(primary[1])}` : "seguimiento estrategico activo";
  const secondaryText = secondary.length
    ? ` Tambien registra ${secondary.map(([key, value]) => `${formatValue(value)} ${formatLabel(key).toLowerCase()}`).join(" y ")}.`
    : "";
  const focus = slide.type === "COVER" ? "El panorama institucional" : slide.type === "CLOSING" ? "El cierre ejecutivo" : `La ${getSlideFocusLabel(slide).toLowerCase()}`;
  return `${focus} de ${clampText(subject, 90)} presenta ${primaryText}.${secondaryText} Este corte permite orientar la conversacion hacia avances, brechas y proximas decisiones.`;
}

function getArrayInsights(content: Record<string, unknown>) {
  return objectEntries(content)
    .filter(([key, value]) => !isNoiseKey(key) && Array.isArray(value) && value.length > 0)
    .flatMap(([key, value]) => {
      const items = value as unknown[];
      return items.slice(0, 4).map((item, index) => {
        if (typeof item === "string" || typeof item === "number") {
          return { key: `${key}-${index}`, label: formatLabel(key), value: clampText(item, 110) };
        }
        if (item && typeof item === "object") {
          const entries = objectEntries(item);
          const title = entries.find(([entryKey]) => /name|title|nombre|titulo|objective|apuesta|meta/i.test(entryKey))?.[1]
            ?? entries[0]?.[1];
          const detail = entries.find(([entryKey]) => /coverage|progress|avance|porcentaje|total|count|kr/i.test(entryKey))?.[1]
            ?? entries[1]?.[1];
          return {
            key: `${key}-${index}`,
            label: formatLabel(key),
            value: `${clampText(title, 82)}${detail ? ` - ${formatValue(detail)}` : ""}`,
          };
        }
        return null;
      }).filter(Boolean) as { key: string; label: string; value: string }[];
    })
    .slice(0, 4);
}

function slideAccent(type: PresentationSlide["type"], index: number) {
  if (type === "COVER") return COLORS.yellow;
  if (type === "CLOSING") return COLORS.green;
  return [COLORS.blue, COLORS.orange, COLORS.green, COLORS.yellow][index % 4];
}

function slideTypeLabel(type: PresentationSlide["type"]) {
  return {
    COVER: "Apertura",
    STRATEGIC_BET: "Apuesta estrategica",
    CLOSING: "Cierre",
  }[type];
}

function getMetricIcon(index: number) {
  return [Target, BarChart3, Layers3, TrendingUp, Flag, Award, Compass, Sparkles][index % 8];
}

const noOverflowText: CSSProperties = {
  overflowWrap: "break-word",
  wordBreak: "normal",
  hyphens: "manual",
};

const clampFourLines: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 4,
  overflow: "hidden",
};

function StageMotion({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.58, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-white px-3 py-2" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 10px 30px rgba(17,24,39,0.08)" }}>
        <IcesiLogo size={compact ? "sm" : "md"} />
      </div>
      <div className="hidden min-w-0 sm:block">
        <p style={{ fontSize: compact ? 9 : 10, fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>
          Modulo de trazabilidad estrategica
        </p>
        <p style={{ fontSize: compact ? 11 : 12, fontWeight: 850, color: COLORS.ink, marginTop: 2 }}>
          Escuela TDI
        </p>
      </div>
    </div>
  );
}

function HeroMetricTile({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return (
    <StageMotion delay={0.28} className="h-full min-w-0">
      <div
        className="relative flex h-[184px] min-w-0 overflow-hidden rounded-md p-5"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${COLORS.ink} 118%)`,
          border: `1px solid ${color}`,
          boxShadow: `0 22px 54px ${color}38`,
        }}
      >
        <motion.div
          aria-hidden
          className="absolute rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.18, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.44, ease }}
          style={{ width: 180, height: 180, right: -58, top: -58, border: "28px solid #fff" }}
        />
        <div className="relative flex min-w-0 flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.34)", color: "#fff" }}>
              <TrendingUp size={17} />
            </span>
            <span style={{ width: 42, height: 5, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.76)" }} />
          </div>
          <div className="min-w-0">
            <p style={{ ...noOverflowText, color: "#fff", fontSize: "clamp(38px, 5vw, 66px)", fontWeight: 900, lineHeight: 0.92 }}>
              {value}
            </p>
            <p style={{ ...noOverflowText, color: "rgba(255,255,255,0.86)", fontSize: 11, fontWeight: 900, lineHeight: 1.3, marginTop: 10, textTransform: "uppercase" }}>
              {label}
            </p>
            <p style={{ ...noOverflowText, color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: 700, lineHeight: 1.35, marginTop: 5 }}>
              {detail}
            </p>
          </div>
        </div>
      </div>
    </StageMotion>
  );
}

function MetricTile({ label, value, color, index }: { label: string; value: string; color: string; index: number }) {
  const Icon = getMetricIcon(index);
  return (
    <StageMotion delay={0.38 + index * 0.07} className="h-full min-w-0">
      <div
        className="flex h-[118px] min-w-0 flex-col justify-between rounded-md p-4"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 10px 34px rgba(17,24,39,0.06)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{
              backgroundColor: `${color}18`,
              border: `1px solid ${color}30`,
              color,
            }}
          >
            <Icon size={17} />
          </div>
          <span style={{ width: 34, height: 5, borderRadius: 99, backgroundColor: color }} />
        </div>
        <div className="min-w-0">
          <p style={{ ...noOverflowText, color, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>
            {value}
          </p>
          <p style={{ ...noOverflowText, color: COLORS.textDim, fontSize: 9.5, fontWeight: 900, lineHeight: 1.32, marginTop: 8, textTransform: "uppercase" }}>
            {label}
          </p>
        </div>
      </div>
    </StageMotion>
  );
}

function ContextTile({ subject, accent }: { subject: string; accent: string }) {
  return (
    <StageMotion delay={0.4} className="h-full min-w-0">
      <div className="flex h-[118px] min-w-0 flex-col justify-between rounded-md p-4" style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}32`, boxShadow: "0 10px 34px rgba(17,24,39,0.06)" }}>
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "#fff", color: accent, border: `1px solid ${accent}34` }}>
            <Flag size={17} />
          </span>
          <span style={{ width: 34, height: 5, borderRadius: 99, backgroundColor: accent }} />
        </div>
        <div>
          <p style={{ color: COLORS.textMuted, fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>Foco narrativo</p>
          <p style={{ ...noOverflowText, color: COLORS.text, fontSize: 13, fontWeight: 900, lineHeight: 1.25, marginTop: 5 }}>
            {clampText(subject, 88)}
          </p>
        </div>
      </div>
    </StageMotion>
  );
}

function MetricsGrid({ content, accent, subject }: { content: Record<string, unknown>; accent: string; subject: string }) {
  const entries = getScalarEntries(content).slice(0, 6);
  if (!entries.length) return null;
  const primary = getPrimaryMetric(entries);
  const secondary = entries.filter(([key]) => key !== primary?.[0]).slice(0, 4);
  const primaryLabel = primary ? formatLabel(primary[0]) : "Indicador principal";
  const primaryValue = primary ? formatValue(primary[1]) : "-";

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.05fr_1.15fr]">
      <HeroMetricTile color={accent} detail={clampText(subject, 96)} label={primaryLabel} value={primaryValue} />
      <div className="grid grid-cols-2 gap-3">
        {secondary.length ? secondary.map(([key, value], index) => (
          <MetricTile
            key={key}
            index={index}
            label={formatLabel(key)}
            value={formatValue(value)}
            color={[accent, COLORS.green, COLORS.orange, COLORS.blue, COLORS.yellow, COLORS.ink][index % 6]}
          />
        )) : (
          <>
            <ContextTile accent={accent} subject={subject} />
            <ContextTile accent={COLORS.green} subject="Actualizacion automatica del tablero institucional." />
          </>
        )}
      </div>
    </div>
  );
}

function InsightList({ content, accent }: { content: Record<string, unknown>; accent: string }) {
  const details = objectEntries(content).filter(([key, value]) =>
    key !== "executionSummary" && !isNoiseKey(key) && value !== null && value !== undefined && value !== "" && typeof value !== "object",
  );
  const arrayInsights = getArrayInsights(content);
  const entries = arrayInsights.length
    ? arrayInsights
    : details.slice(0, 5).map(([key, value]) => ({ key, label: formatLabel(key), value: formatValue(value) }));

  if (!entries.length) return null;

  return (
    <StageMotion delay={0.66} className="h-full">
      <div className="relative h-full overflow-hidden rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 14px 42px rgba(17,24,39,0.07)" }}>
        <div aria-hidden className="absolute right-0 top-0 h-full w-1.5" style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }} />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${accent}16`, color: accent, border: `1px solid ${accent}30` }}>
              <Lightbulb size={15} />
            </span>
            <p style={{ color: COLORS.ink, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>Puntos clave</p>
          </div>
          <span style={{ width: 30, height: 5, borderRadius: 99, backgroundColor: accent }} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.key}
              className="flex min-h-[58px] min-w-0 items-start gap-3 rounded-md px-3 py-2.5"
              style={{ backgroundColor: index === 0 ? `${accent}12` : COLORS.surfaceMuted, border: `1px solid ${index === 0 ? `${accent}32` : COLORS.border}` }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.42, delay: 0.72 + index * 0.08, ease }}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded" style={{ backgroundColor: index === 0 ? accent : "#fff", color: index === 0 ? "#fff" : accent, border: `1px solid ${accent}34`, fontSize: 10, fontWeight: 900 }}>
                {index + 1}
              </span>
              <div className="min-w-0">
                <p style={{ ...noOverflowText, color: COLORS.textMuted, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{entry.label}</p>
                <p style={{ ...noOverflowText, color: COLORS.text, fontSize: 12, fontWeight: 800, lineHeight: 1.35, marginTop: 2 }}>{entry.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </StageMotion>
  );
}

function NarrativePanel({ text, accent }: { text: string; accent: string }) {
  return (
    <StageMotion delay={0.58}>
      <div className="relative h-[150px] overflow-hidden rounded-md bg-white p-5" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 16px 48px rgba(17,24,39,0.07)" }}>
        <motion.div
          aria-hidden
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 0.12, x: 0 }}
          transition={{ duration: 0.7, delay: 0.74, ease }}
          style={{ position: "absolute", right: -36, top: -36, width: 132, height: 132, borderRadius: 999, backgroundColor: accent }}
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${accent}16`, color: accent, border: `1px solid ${accent}34` }}>
            <Compass size={19} />
          </div>
          <div className="min-w-0">
            <p style={{ color: accent, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Lectura ejecutiva</p>
            <p style={{ ...noOverflowText, ...clampFourLines, color: COLORS.text, fontSize: "clamp(13px, 1.05vw, 16px)", fontWeight: 700, lineHeight: 1.42, marginTop: 8 }}>
              {clampText(text, 260)}
            </p>
          </div>
        </div>
      </div>
    </StageMotion>
  );
}

function SlideRail({
  slide,
  total,
  current,
  period,
  accent,
  subject,
  focusLabel,
}: {
  slide: PresentationSlide;
  total: number;
  current: number;
  period: string | null;
  accent: string;
  subject: string;
  focusLabel: string;
}) {
  return (
    <aside className="hidden h-full w-[29%] min-w-[320px] flex-col justify-between p-8 xl:flex" style={{ background: `linear-gradient(160deg, #FFFFFF 0%, ${accent}14 100%)`, borderRight: `1px solid ${COLORS.border}` }}>
      <StageMotion delay={0.04}>
        <BrandMark />
        <div className="mt-7 flex gap-1">
          {BRAND_STRIPES.map((color, index) => (
            <motion.span
              key={color}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: index === current % 4 ? 48 : 28, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.16 + index * 0.06, ease }}
              style={{ height: 4, borderRadius: 99, backgroundColor: color }}
            />
          ))}
        </div>
      </StageMotion>

      <StageMotion delay={0.2}>
        <div className="rounded-md bg-white p-5" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 18px 48px rgba(17,24,39,0.08)" }}>
          <p style={{ color: accent, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
            {focusLabel}
          </p>
          <h2 style={{ ...noOverflowText, color: COLORS.ink, fontSize: 28, fontWeight: 900, lineHeight: 1.08, marginTop: 12 }}>
            {clampText(subject, 96)}
          </h2>
          <div className="mt-5 flex items-center justify-between gap-3">
            <span style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
              {slideTypeLabel(slide.type)}
            </span>
            <span style={{ color: COLORS.text, fontSize: 11, fontWeight: 900 }}>
              {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
        </div>
      </StageMotion>

      <StageMotion delay={0.34}>
        <div className="rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 12px 34px rgba(17,24,39,0.06)" }}>
          <p style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Periodo</p>
          <p style={{ ...noOverflowText, color: COLORS.text, fontSize: 15, fontWeight: 900, marginTop: 5 }}>{period ?? "Activo"}</p>
        </div>
      </StageMotion>
    </aside>
  );
}

function SlideView({ slide, total, current, period }: { slide: PresentationSlide; total: number; current: number; period: string | null }) {
  const accent = slideAccent(slide.type, current);
  const isCover = slide.type === "COVER";
  const subject = getSlideSubject(slide);
  const focusLabel = getSlideFocusLabel(slide);
  const summaryText = getSummaryText(slide.content) || buildExecutiveSummary(slide, subject);

  return (
    <motion.article
      key={`${slide.order}-${current}`}
      className="relative h-full w-full overflow-hidden"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.58, ease }}
      style={{
        background: `radial-gradient(circle at 84% 14%, ${accent}22, transparent 31%), radial-gradient(circle at 15% 86%, ${COLORS.blue}12, transparent 28%), linear-gradient(135deg, #FFFFFF 0%, ${COLORS.bg} 100%)`,
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(17,24,39,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(17,24,39,0.035) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "linear-gradient(180deg, rgba(0,0,0,0.65), transparent 76%)" }} />
      <div className="relative flex h-full">
        <SlideRail slide={slide} total={total} current={current} period={period} accent={accent} subject={subject} focusLabel={focusLabel} />

        <main className="flex min-w-0 flex-1 flex-col justify-start gap-4 overflow-hidden px-5 pb-5 pt-6 sm:px-8 md:px-10 xl:px-12 xl:pb-7 xl:pt-8">
          <StageMotion delay={0.08}>
            <div className="flex items-center justify-between gap-4 xl:hidden">
              <BrandMark compact />
              <span style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: 900 }}>
                {current + 1}/{total}
              </span>
            </div>
          </StageMotion>

          <div className="max-w-[1120px]">
            <StageMotion delay={0.12}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}36`, color: accent }}>
                  <Sparkles size={12} />
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{period ?? "Periodo activo"}</span>
                </span>
                <span style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{slideTypeLabel(slide.type)}</span>
              </div>
            </StageMotion>

            <StageMotion delay={0.2}>
              <h1
                style={{
                  ...noOverflowText,
                  color: COLORS.ink,
                  fontSize: isCover ? "clamp(32px, 4.25vw, 58px)" : "clamp(28px, 3.5vw, 48px)",
                  fontWeight: 900,
                  lineHeight: 1.02,
                  maxWidth: 980,
                }}
              >
                {clampText(slide.title, isCover ? 110 : 126)}
              </h1>
            </StageMotion>

            {slide.subtitle && (
              <StageMotion delay={0.34}>
                <p style={{ ...noOverflowText, color: COLORS.textDim, fontSize: "clamp(15px, 1.45vw, 20px)", fontWeight: 650, lineHeight: 1.42, maxWidth: 860, marginTop: 18 }}>
                  {clampText(slide.subtitle, 210)}
                </p>
              </StageMotion>
            )}
          </div>

          <div className="grid max-w-[1180px] grid-cols-1 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="space-y-4">
              <MetricsGrid content={slide.content} accent={accent} subject={subject} />
              <NarrativePanel text={summaryText} accent={accent} />
            </div>
            <InsightList content={slide.content} accent={accent} />
          </div>
        </main>
      </div>
    </motion.article>
  );
}

function NavDots({ current, total, onGo }: { current: number; total: number; onGo: (index: number) => void }) {
  return (
    <div className="flex max-w-[42vw] items-center gap-1.5 overflow-hidden">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onGo(index)}
          className="shrink-0"
          style={{
            width: current === index ? 28 : 7,
            height: 7,
            borderRadius: 99,
            backgroundColor: current === index ? COLORS.blue : "#CBD5E1",
            transition: "all 0.24s ease",
          }}
          title={`Ir a diapositiva ${index + 1}`}
        />
      ))}
    </div>
  );
}

function DeckButton({ children, onClick, disabled, title, solid = false }: { children: ReactNode; onClick: () => void; disabled?: boolean; title?: string; solid?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-9 items-center justify-center gap-1.5 rounded-md px-3 disabled:opacity-35"
      style={{
        backgroundColor: solid ? COLORS.blue : COLORS.surface,
        color: solid ? "#fff" : COLORS.text,
        border: `1px solid ${solid ? COLORS.blue : COLORS.border}`,
        fontSize: 12,
        fontWeight: 850,
        boxShadow: solid ? `0 12px 26px ${COLORS.blue}30` : "0 1px 2px rgba(17,24,39,0.05)",
      }}
    >
      {children}
    </button>
  );
}

function DeckState({ type, message, onRetry }: { type: "loading" | "error" | "empty"; message: string; onRetry?: () => void }) {
  const color = type === "error" ? COLORS.orange : COLORS.blue;
  return (
    <div className="flex h-full items-center justify-center px-6" style={{ background: `radial-gradient(circle at 50% 35%, ${color}14, transparent 34%), linear-gradient(135deg, #FFFFFF 0%, ${COLORS.bg} 100%)` }}>
      <motion.div
        className="w-full max-w-[520px] rounded-md bg-white p-7 text-center"
        style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 24px 70px rgba(17,24,39,0.10)" }}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="mb-5 flex justify-center">
          <BrandMark compact />
        </div>
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md" style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}36` }}>
          {type === "loading" ? <Loader2 size={19} className="animate-spin" /> : type === "error" ? <RefreshCw size={18} /> : <Sparkles size={18} />}
        </div>
        <p style={{ ...noOverflowText, color: type === "error" ? COLORS.orange : COLORS.ink, fontSize: 16, fontWeight: 900, lineHeight: 1.35 }}>
          {message}
        </p>
        {onRetry && (
          <div className="mt-5 flex justify-center">
            <DeckButton onClick={onRetry}>
              <RefreshCw size={14} /> Reintentar
            </DeckButton>
          </div>
        )}
      </motion.div>
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );

  const loadPresentation = useCallback(async (silent = false) => {
    if (!validatePeriod(period)) {
      setError("El periodo debe tener formato YYYY-Q1..Q4 o YYYY-1..2.");
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const [periodList, presentation] = await Promise.all([
        academicPeriodsApi.list(),
        presentationApi.get({ period: period || undefined }),
      ]);
      setPeriods(periodList);
      setData(presentation);
      setLastUpdatedAt(new Date());
      setIndex((current) => Math.min(current, Math.max(0, presentation.slides.length - 1)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setIndex(0);
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
    if (!data) return undefined;
    const timer = window.setInterval(() => {
      void loadPresentation(true);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [data, loadPresentation]);

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
  const updatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Montserrat, sans-serif",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        zIndex: 9999,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "#E5E7EB", zIndex: 20 }}>
        <motion.div
          style={{ height: "100%", background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.yellow}, ${COLORS.green})` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.36, ease }}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <DeckState type="loading" message="Cargando presentacion..." />
        ) : error ? (
          <DeckState type="error" message={error} onRetry={() => void loadPresentation()} />
        ) : slide ? (
          <AnimatePresence mode="wait">
            <SlideView slide={slide} total={slides.length} current={index} period={data?.period ?? null} />
          </AnimatePresence>
        ) : (
          <DeckState type="empty" message="No hay diapositivas para el periodo seleccionado." />
        )}
      </div>

      <footer
        className="items-center justify-between gap-4 px-5 py-3"
        style={{
          display: isFullscreen ? "none" : "flex",
          minHeight: 76,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTop: `1px solid ${COLORS.border}`,
          backdropFilter: "blur(16px)",
          boxShadow: "0 -12px 34px rgba(17,24,39,0.08)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <DeckButton onClick={() => navigate("/dashboard")} title="Salir">
            <X size={14} /> <span className="hidden sm:inline">Salir</span>
          </DeckButton>
          <Select value={period || "__active"} onValueChange={(next) => handlePeriodChange(next === "__active" ? "" : next)}>
            <SelectTrigger className="h-9 w-[178px] rounded-md border-[#D9DEE8] bg-white text-xs font-bold focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="z-[10000] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
              <SelectItem value="__active" className="rounded-md px-3 py-2 text-xs font-bold">Periodo activo</SelectItem>
              {sortedPeriods.map((item) => (
                <SelectItem key={item.id} value={item.name} className="rounded-md px-3 py-2 text-xs font-bold">
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden items-center gap-1.5 rounded-md px-2.5 py-2 md:flex" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 11, fontWeight: 800 }}>
            <Clock3 size={13} /> {updatedLabel}
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2">
          <NavDots current={index} total={slides.length} onGo={setIndex} />
          <p className="max-w-[34vw] truncate" style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
            {data?.title ?? "Presentacion"} - {slides.length ? index + 1 : 0}/{slides.length}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <DeckButton onClick={toggleFullscreen} disabled={!data?.controls.fullscreenEnabled} title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </DeckButton>
          <DeckButton onClick={goPrev} disabled={index === 0}>
            <ChevronLeft size={14} /> <span className="hidden sm:inline">Anterior</span>
          </DeckButton>
          <DeckButton onClick={goNext} disabled={index >= slides.length - 1} solid={index < slides.length - 1}>
            <span className="hidden sm:inline">Siguiente</span> <ChevronRight size={14} />
          </DeckButton>
        </div>
      </footer>
    </div>
  );
}
