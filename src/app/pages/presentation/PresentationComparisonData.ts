import type { GeneralReport } from "../../services/reportsApi";
import type { ExecutionSummary, Goal, StrategicBet } from "../../services/strategicApi";
import type { ComparisonCsvRow } from "./presentationExportUtils";
import type { PeriodComparisonStats } from "./PresentationTypes";

/** Entity selected on one side of the comparator (A or B). */
export type ComparisonEntity =
  | { type: "bet"; data?: StrategicBet }
  | { type: "goal"; data?: Goal };

/** Maps an API period report to the counts shown in the comparator, without estimating anything. */
export function toPeriodComparisonStats(periodName: string, report: GeneralReport): PeriodComparisonStats {
  return {
    periodName,
    totalKeyResults: report.totalKeyResults ?? 0,
    activeKeyResults: report.activeKeyResults ?? 0,
    closedKeyResults: report.closedKeyResults ?? 0,
    totalProjects: report.totalProjects ?? 0,
    activeProjects: report.activeProjects ?? 0,
    completedProjects: report.completedProjects ?? 0,
  };
}

function totalProjects(summary?: ExecutionSummary) {
  return (summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0);
}

/** Chart data for the grouped entity comparison: recorded counts only. */
export function buildEntityChartData(summaryA?: ExecutionSummary, summaryB?: ExecutionSummary) {
  return [
    { metric: "KRs Completados", entityA: summaryA?.completedKeyResults ?? 0, entityB: summaryB?.completedKeyResults ?? 0 },
    { metric: "KRs en Progreso", entityA: summaryA?.inProgressKeyResults ?? 0, entityB: summaryB?.inProgressKeyResults ?? 0 },
    { metric: "Iniciativas Totales", entityA: totalProjects(summaryA), entityB: totalProjects(summaryB) },
  ];
}

/** Chart data for the grouped period comparison: recorded counts only. */
export function buildPeriodChartData(periodAStats: PeriodComparisonStats, periodBStats: PeriodComparisonStats) {
  return buildPeriodComparisonRows(periodAStats, periodBStats).map((row) => ({
    metric: row.metric,
    periodA: Number(row.valA),
    periodB: Number(row.valB),
  }));
}

/** Rows for the period table and CSV: both recorded values, no difference. */
export function buildPeriodComparisonRows(
  statsA: PeriodComparisonStats,
  statsB: PeriodComparisonStats,
): ComparisonCsvRow[] {
  return [
    { metric: "KRs totales", valA: statsA.totalKeyResults, valB: statsB.totalKeyResults, unit: "KRs" },
    { metric: "KRs activos", valA: statsA.activeKeyResults, valB: statsB.activeKeyResults, unit: "KRs" },
    { metric: "KRs cerrados", valA: statsA.closedKeyResults, valB: statsB.closedKeyResults, unit: "KRs" },
    { metric: "Iniciativas totales", valA: statsA.totalProjects, valB: statsB.totalProjects, unit: "Iniciativas" },
    { metric: "Iniciativas activas", valA: statsA.activeProjects, valB: statsB.activeProjects, unit: "Iniciativas" },
    { metric: "Iniciativas completadas", valA: statsA.completedProjects, valB: statsB.completedProjects, unit: "Iniciativas" },
  ];
}

/** Rows for the entity table and CSV: recorded status and counts, no difference. */
export function buildEntityComparisonRows(entityA: ComparisonEntity, entityB: ComparisonEntity): ComparisonCsvRow[] {
  const summaryA = entityA.data?.executionSummary;
  const summaryB = entityB.data?.executionSummary;
  return [
    { metric: "Estado", valA: entityA.data?.status ?? "Sin registro", valB: entityB.data?.status ?? "Sin registro" },
    { metric: "KRs completados", valA: summaryA?.completedKeyResults ?? 0, valB: summaryB?.completedKeyResults ?? 0, unit: "KRs" },
    { metric: "KRs en progreso", valA: summaryA?.inProgressKeyResults ?? 0, valB: summaryB?.inProgressKeyResults ?? 0, unit: "KRs" },
    { metric: "Iniciativas totales", valA: totalProjects(summaryA), valB: totalProjects(summaryB), unit: "Iniciativas" },
    { metric: "Iniciativas completadas", valA: summaryA?.completedProjects ?? 0, valB: summaryB?.completedProjects ?? 0, unit: "Iniciativas" },
  ];
}
