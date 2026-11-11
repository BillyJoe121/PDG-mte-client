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

/** One metric of the visual comparison: the recorded value on each side. */
export interface ComparisonBarRow {
  metric: string;
  a: number;
  b: number;
}

/** Bars of the comparison: the numeric rows of the table, in the same order. Text rows such as Estado are left out. */
export function buildComparisonBars(rows: ComparisonCsvRow[]): ComparisonBarRow[] {
  return rows
    .filter((row) => typeof row.valA === "number" && typeof row.valB === "number")
    .map((row) => ({ metric: row.metric, a: Number(row.valA), b: Number(row.valB) }));
}

export interface ComparisonDifference {
  /** B − A, or null when the row is not numeric. */
  value: number | null;
  /** Visible text: ▲ +N, ▼ −N, = 0 or —. */
  text: string;
  /** Spoken description for screen readers. */
  label: string;
}

/** Difference B − A between two recorded values. Only computed when both values are numbers. */
export function comparisonDifference(row: ComparisonCsvRow): ComparisonDifference {
  if (typeof row.valA !== "number" || typeof row.valB !== "number") {
    return { value: null, text: "—", label: "Sin diferencia numérica" };
  }
  const value = row.valB - row.valA;
  const amount = new Intl.NumberFormat("es-CO").format(Math.abs(value));
  if (value > 0) return { value, text: `▲ +${amount}`, label: `B tiene ${amount} más que A` };
  if (value < 0) return { value, text: `▼ −${amount}`, label: `B tiene ${amount} menos que A` };
  return { value, text: "= 0", label: "A y B tienen el mismo valor" };
}

/** Rows for the period table and CSV: both recorded values. */
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

/** Rows for the entity table and CSV: recorded status and counts. */
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
