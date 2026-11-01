import {
  PERIOD_REGEX,
  type ConsolidatedReport,
  type GeneralReport,
  type PeriodComparison,
} from "../../services/reportsApi";

export const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  red: "#DC2626",
  yellow: "#E4EB60",
  purple: "#7C3AED",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

export type ReportTab = "general" | "departments" | "ranking" | "comparison";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar el reporte.";
}

export function formatPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0%";
  const numeric = Number(String(value).replace("%", ""));
  if (Number.isNaN(numeric)) return "0%";
  return `${Math.round(numeric)}%`;
}

export function numericPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace("%", "")) || 0;
}

/** Orders KRs by the progress percentage recorded by their owners, highest first, without modifying it. */
export function sortByRecordedProgress<T extends { progressPercentage: string | number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => numericPercent(b.progressPercentage) - numericPercent(a.progressPercentage));
}

export function validatePeriod(value: string) {
  return !value || PERIOD_REGEX.test(value);
}

export function boundedPercent(value: string | number | null | undefined) {
  return Math.max(0, Math.min(100, numericPercent(value)));
}

export function activeLabel(value: string, fallback = "Todos") {
  return value || fallback;
}

export function reportTitleForTab(tab: ReportTab) {
  return {
    general: "Reporte consolidado estrategico",
    departments: "Reporte por departamento",
    ranking: "KRs por avance registrado",
    comparison: "Comparativa de periodos",
  }[tab];
}

export function buildCsvRows(report: ConsolidatedReport, tab: ReportTab, comparison: PeriodComparison | null) {
  const rows: Record<string, string | number>[] = [];
  const pushMetric = (section: string, name: string, value: string | number) => {
    rows.push({ seccion: section, nombre: name, valor: value });
  };

  if (tab === "general") {
    pushMetric("Consolidado", "Periodo", report.general.period ?? "Activo");
    pushMetric("Consolidado", "Iniciativas totales", report.general.totalProjects);
    pushMetric("Consolidado", "Iniciativas activas", report.general.activeProjects);
    pushMetric("Consolidado", "Iniciativas completadas", report.general.completedProjects);
    pushMetric("Consolidado", "KRs totales", report.general.totalKeyResults);
    pushMetric("Consolidado", "KRs activos", report.general.activeKeyResults);
    pushMetric("Consolidado", "KRs cerrados", report.general.closedKeyResults);
  }

  if (tab === "general" || tab === "departments") {
    report.departments.forEach((department) => {
      rows.push({
        seccion: "Departamentos",
        nombre: department.departmentName,
        iniciativas: department.projects,
        key_results: department.keyResults,
        krs_cerrados: department.closedKeyResults,
      });
    });
  }

  if (tab === "general" || tab === "ranking") {
    sortByRecordedProgress(report.keyResultRanking).forEach((keyResult, index) => {
      rows.push({
        seccion: "KRs por avance registrado",
        posicion: index + 1,
        nombre: keyResult.keyResultName,
        metas: (keyResult.goalNames ?? []).join("; "),
        apuestas: (keyResult.strategicBetNames ?? []).join("; "),
        periodo: keyResult.period,
        iniciativas_vinculadas: keyResult.linkedProjects,
        avance_registrado: keyResult.progressPercentage,
      });
    });
  }

  if (tab === "comparison" && comparison) {
    [
      ["Base", comparison.basePeriod, comparison.base],
      ["Comparado", comparison.comparePeriod, comparison.compare],
    ].forEach(([section, periodName, item]) => {
      const periodReport = item as GeneralReport;
      rows.push({
        seccion: String(section),
        periodo: String(periodName),
        iniciativas: periodReport.totalProjects,
        iniciativas_activas: periodReport.activeProjects,
        iniciativas_completadas: periodReport.completedProjects,
        key_results: periodReport.totalKeyResults,
        krs_activos: periodReport.activeKeyResults,
        krs_cerrados: periodReport.closedKeyResults,
      });
    });
  }

  return rows;
}

export function keyResultStrategyText(row: { goalNames?: string[]; strategicBetNames?: string[] }) {
  const names = [...(row.goalNames ?? []), ...(row.strategicBetNames ?? [])].filter(Boolean);
  return names.length ? names.join(", ") : "Sin Meta ni Apuesta";
}
