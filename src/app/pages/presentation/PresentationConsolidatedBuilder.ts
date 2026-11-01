import type { ConsolidatedReport, PresentationSlide } from "../../services/reportsApi";
import { sortByRecordedProgress } from "../reportes/reportUtils";

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
      subtitle: "Ordenados por el porcentaje que registró cada responsable. El sistema no calcula este avance.",
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
