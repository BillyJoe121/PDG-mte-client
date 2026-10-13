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

export function validatePeriod(value: string) {
  return !value || PERIOD_REGEX.test(value);
}

export function coverageColor(value: string | number | null | undefined) {
  const coverage = numericPercent(value);
  if (coverage >= 70) return COLORS.green;
  if (coverage >= 40) return COLORS.blue;
  return COLORS.orange;
}

export function boundedPercent(value: string | number | null | undefined) {
  return Math.max(0, Math.min(100, numericPercent(value)));
}

export function activeLabel(value: string, fallback = "Todos") {
  return value || fallback;
}

export function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function getCoverageBand(value: string | number | null | undefined) {
  const coverage = numericPercent(value);
  if (coverage >= 70) return "Alta";
  if (coverage >= 40) return "Media";
  return "Baja";
}

export function reportTitleForTab(tab: ReportTab) {
  return {
    general: "Reporte consolidado estrategico",
    departments: "Reporte por departamento",
    ranking: "Ranking de KRs por cobertura",
    comparison: "Comparativa de periodos",
  }[tab];
}

export function buildCsvRows(report: ConsolidatedReport, tab: ReportTab, comparison: PeriodComparison | null) {
  const rows: Record<string, string | number>[] = [];
  const pushMetric = (section: string, name: string, value: string | number, context = "") => {
    rows.push({ seccion: section, nombre: name, valor: value, contexto: context });
  };

  if (tab === "general") {
    pushMetric("Consolidado", "Periodo", report.general.period ?? "Activo");
    pushMetric("Consolidado", "Iniciativas totales", report.general.totalProjects);
    pushMetric("Consolidado", "Iniciativas activas", report.general.activeProjects);
    pushMetric("Consolidado", "Iniciativas completadas", report.general.completedProjects);
    pushMetric("Consolidado", "Key Results", report.general.totalKeyResults);
    pushMetric("Consolidado", "Cobertura promedio KRs", report.general.averageKeyResultCoverage);
  }

  if (tab === "general" || tab === "departments") {
    report.departments.forEach((department) => {
      rows.push({
        seccion: "Departamentos",
        nombre: department.departmentName,
        iniciativas: department.projects,
        key_results: department.keyResults,
        cobertura_promedio_krs: department.averageKeyResultCoverage,
      });
    });
  }

  if (tab === "general" || tab === "ranking") {
    report.keyResultRanking.forEach((keyResult, index) => {
      rows.push({
        seccion: "Ranking KRs",
        posicion: index + 1,
        nombre: keyResult.keyResultName,
        metas: (keyResult.goalNames ?? []).join("; "),
        apuestas: (keyResult.strategicBetNames ?? []).join("; "),
        periodo: keyResult.period,
        iniciativas_vinculadas: keyResult.linkedProjects,
        cobertura: keyResult.coveragePercentage,
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
        cobertura_krs: periodReport.averageKeyResultCoverage,
      });
    });
    pushMetric("Comparativa", `Cobertura KRs: ${comparison.comparePeriod} frente a ${comparison.basePeriod}`, comparison.keyResultCoverageDelta);
  }

  return rows;
}

export function keyResultStrategyText(row: { goalNames?: string[]; strategicBetNames?: string[] }) {
  const names = [...(row.goalNames ?? []), ...(row.strategicBetNames ?? [])].filter(Boolean);
  return names.length ? names.join(", ") : "Sin Meta ni Apuesta";
}
