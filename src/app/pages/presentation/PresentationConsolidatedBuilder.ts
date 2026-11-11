import type { ConsolidatedReport, KeyResultRanking, PresentationSlide } from "../../services/reportsApi";
import type { Goal } from "../../services/strategicApi";
import { sortByRecordedProgress } from "./recordedProgress";

export function numericPercent(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace("%", "")) || 0;
}

export function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0%";
  const num = Number(String(value).replace("%", ""));
  if (Number.isNaN(num)) return "0%";
  return `${Number(num.toFixed(2))}%`;
}

export function boundedPercent(value: string | number | null | undefined): number {
  return Math.max(0, Math.min(100, numericPercent(value)));
}

function hasConsolidatedReport(report: ConsolidatedReport | null | undefined): report is ConsolidatedReport {
  return Boolean(report && report.general);
}

/**
 * Builds the consolidated slides from the report returned by the API.
 * Nothing is invented: without a report a single empty-state slide is returned,
 * and each slide shows only recorded counts or the progress recorded on each KR.
 */
export function buildConsolidatedSlides(
  rawReport: ConsolidatedReport | null | undefined,
  periodName = "",
): PresentationSlide[] {
  if (!hasConsolidatedReport(rawReport)) {
    return [
      {
        order: 2,
        type: "CONSOLIDATED_EMPTY",
        title: "Reporte consolidado no disponible",
        subtitle: periodName ? `Periodo ${periodName}` : "Periodo vigente",
        content: { periodName },
      },
    ];
  }

  const departments = Array.isArray(rawReport.departments) ? rawReport.departments : [];
  const ranking = Array.isArray(rawReport.keyResultRanking) ? rawReport.keyResultRanking : [];
  const keyResults = sortByRecordedProgress(ranking);

  return [
    {
      order: 2,
      type: "CONSOLIDATED_SUMMARY",
      title: "Información General del Corte",
      subtitle: "Conteos de iniciativas y KRs registrados en el corte.",
      content: { general: rawReport.general, periodName },
    },
    {
      order: 3,
      type: "CONSOLIDATED_RANKING",
      title: "KRs por Avance Registrado",
      subtitle: "Ordenados por el avance que registró cada responsable.",
      content: { keyResults },
    },
    {
      order: 4,
      type: "CONSOLIDATED_DEPTS_SUMMARY",
      title: "Resumen por Departamento",
      subtitle: "Iniciativas, KRs y KRs cerrados registrados por cada departamento.",
      content: { departments },
    },
  ];
}

function normalizeName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function rankingOf(rawReport: ConsolidatedReport | null | undefined) {
  return sortByRecordedProgress(Array.isArray(rawReport?.keyResultRanking) ? rawReport.keyResultRanking : []);
}

/** KRs of the ranking whose linked names include `name`, keeping the recorded-progress order. */
function linkedByName(ranking: KeyResultRanking[], name: string, field: "goalNames" | "strategicBetNames") {
  const target = normalizeName(name);
  if (!target) return [];
  return ranking.filter((kr) => (kr[field] ?? []).some((linked) => normalizeName(linked ?? "") === target));
}

/**
 * Adds to each STRATEGIC_BET slide the KRs of the ranking linked to that bet by name,
 * already ordered by recorded progress. A bet without matches gets an empty list.
 */
export function attachBetKeyResults(
  slides: PresentationSlide[],
  rawReport: ConsolidatedReport | null | undefined,
): PresentationSlide[] {
  const ranking = rankingOf(rawReport);
  return slides.map((slide) =>
    slide.type === "STRATEGIC_BET"
      ? { ...slide, content: { ...slide.content, linkedKeyResults: linkedByName(ranking, slide.title ?? "", "strategicBetNames") } }
      : slide
  );
}

/** One GOAL slide per goal, with its recorded counts and the ranking KRs linked to it by name. */
export function buildGoalSlides(goals: Goal[], rawReport: ConsolidatedReport | null | undefined): PresentationSlide[] {
  const ranking = rankingOf(rawReport);
  return goals.map((goal) => ({
    order: 0,
    type: "GOAL",
    title: goal.name,
    subtitle: goal.description ?? "",
    content: {
      executionSummary: goal.executionSummary,
      expectedValue: goal.expectedValue,
      measurementUnitName: goal.measurementUnitName,
      referenceIndicator: goal.referenceIndicator,
      linkedKeyResults: linkedByName(ranking, goal.name, "goalNames"),
    },
  }));
}

/** Puts the goal slides right after the bet slides, before a closing slide if there is one. */
export function insertGoalSlides(
  slides: PresentationSlide[],
  goals: Goal[],
  rawReport: ConsolidatedReport | null | undefined,
): PresentationSlide[] {
  const goalSlides = buildGoalSlides(goals, rawReport);
  if (!goalSlides.length) return slides;
  const closing = slides.findIndex((slide) => slide.type === "CLOSING");
  const at = closing === -1 ? slides.length : closing;
  return [...slides.slice(0, at), ...goalSlides, ...slides.slice(at)];
}
