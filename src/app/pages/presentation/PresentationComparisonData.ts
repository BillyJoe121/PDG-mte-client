import type { GeneralReport } from "../../services/reportsApi";
import type { ExecutionSummary, Goal, StrategicBet } from "../../services/strategicApi";
import { formatMax2Decimals, type PeriodComparisonStats } from "./PresentationTypes";

/** Entity selected on one side of the comparator (A or B). */
export type ComparisonEntity =
  | { type: "bet"; data?: StrategicBet }
  | { type: "goal"; data?: Goal };

/**
 * Maps an API period report to the stats shown in the comparator. Completed KRs are
 * estimated from `completedRatio` and coverage falls back to `coverageFallback`.
 */
export function toPeriodComparisonStats(
  periodName: string,
  report: GeneralReport,
  completedRatio: number,
  coverageFallback: number,
): PeriodComparisonStats {
  return {
    periodName,
    totalKeyResults: report.totalKeyResults,
    completedKeyResults: Math.round(report.totalKeyResults * completedRatio),
    totalProjects: report.totalProjects,
    completedProjects: report.completedProjects,
    activeProjects: report.activeProjects,
    averageKeyResultCoverage: parseFloat(report.averageKeyResultCoverage) || coverageFallback,
  };
}

/** Chart data for Recharts grouped entity comparison */
export function buildEntityChartData(summaryA?: ExecutionSummary, summaryB?: ExecutionSummary) {
  return [
    {
      metric: "KRs Completados",
      entityA: summaryA?.completedKeyResults ?? 0,
      entityB: summaryB?.completedKeyResults ?? 0,
    },
    {
      metric: "KRs en Progreso",
      entityA: summaryA?.inProgressKeyResults ?? 0,
      entityB: summaryB?.inProgressKeyResults ?? 0,
    },
    {
      metric: "Iniciativas Totales",
      entityA: (summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0),
      entityB: (summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0),
    },
  ];
}

/** Chart data for Recharts grouped period comparison */
export function buildPeriodChartData(periodAStats: PeriodComparisonStats, periodBStats: PeriodComparisonStats) {
  return [
    {
      metric: "KRs Totales",
      periodA: periodAStats.totalKeyResults,
      periodB: periodBStats.totalKeyResults,
    },
    {
      metric: "Iniciativas Totales",
      periodA: periodAStats.totalProjects,
      periodB: periodBStats.totalProjects,
    },
    {
      metric: "Iniciativas Completas",
      periodA: periodAStats.completedProjects,
      periodB: periodBStats.completedProjects,
    },
    {
      metric: "Cobertura KRs (%)",
      periodA: periodAStats.averageKeyResultCoverage,
      periodB: periodBStats.averageKeyResultCoverage,
    },
  ];
}

/** Entity delta rows used by the comparison CSV export. */
export function buildComparisonCsvDeltaRows(
  progressA: number,
  progressB: number,
  summaryA?: ExecutionSummary,
  summaryB?: ExecutionSummary,
) {
  return [
    {
      metric: "Cumplimiento Estimado",
      valA: `${formatMax2Decimals(progressA)}%`,
      valB: `${formatMax2Decimals(progressB)}%`,
      delta: Number((progressA - progressB).toFixed(2)),
      unit: "%",
    },
    {
      metric: "Resultados Clave (KRs) Completados",
      valA: summaryA?.completedKeyResults ?? 0,
      valB: summaryB?.completedKeyResults ?? 0,
      delta: (summaryA?.completedKeyResults ?? 0) - (summaryB?.completedKeyResults ?? 0),
      unit: "KRs",
    },
    {
      metric: "Resultados Clave (KRs) en Progreso",
      valA: summaryA?.inProgressKeyResults ?? 0,
      valB: summaryB?.inProgressKeyResults ?? 0,
      delta: (summaryA?.inProgressKeyResults ?? 0) - (summaryB?.inProgressKeyResults ?? 0),
      unit: "KRs",
    },
    {
      metric: "Iniciativas Totales",
      valA: (summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0),
      valB: (summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0),
      delta:
        ((summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0)) -
        ((summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0)),
      unit: "Iniciativas",
    },
    {
      metric: "Iniciativas Completadas",
      valA: summaryA?.completedProjects ?? 0,
      valB: summaryB?.completedProjects ?? 0,
      delta: (summaryA?.completedProjects ?? 0) - (summaryB?.completedProjects ?? 0),
      unit: "Iniciativas",
    },
  ];
}
