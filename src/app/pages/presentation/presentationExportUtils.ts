import { buildExportFilename, downloadCSV, printPDF } from "../../utils/exportUtils";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { ConsolidatedReport, PresentationSlide } from "../../services/reportsApi";
import type { ComparisonType } from "./PresentationTypes";

export interface ComparisonCsvRow {
  metric: string;
  valA: number | string;
  valB: number | string;
  unit?: string;
}

function summaryColumns(item: StrategicBet | Goal) {
  const summary = item.executionSummary;
  return {
    krs_completados: summary?.completedKeyResults ?? 0,
    krs_en_progreso: summary?.inProgressKeyResults ?? 0,
    iniciativas_completadas: summary?.completedProjects ?? 0,
    iniciativas_en_progreso: summary?.inProgressProjects ?? 0,
  };
}

function betRow(bet: StrategicBet, periodName: string) {
  return {
    categoria: "Apuesta Estratégica",
    id: bet.id,
    nombre: bet.name,
    periodo: periodName,
    estado: bet.status,
    ...summaryColumns(bet),
    descripcion: bet.description ?? "",
  };
}

function goalRow(goal: Goal, periodName: string) {
  return {
    categoria: "Meta Institucional",
    id: goal.id,
    nombre: goal.name,
    periodo: periodName,
    estado: goal.status,
    valor_esperado: goal.expectedValue ?? "",
    unidad_medida: goal.measurementUnitName ?? "",
    indicador_referencia: goal.referenceIndicator ?? "",
    ...summaryColumns(goal),
    descripcion: goal.description ?? "",
  };
}

/** Exports every bet and goal with the counts recorded for each one. No progress is calculated. */
export function exportGeneralReportCsv(bets: StrategicBet[], goals: Goal[], periodName: string) {
  const rows: Record<string, string | number>[] = [
    ...bets.map((bet) => betRow(bet, periodName)),
    ...goals.map((goal) => goalRow(goal, periodName)),
  ];
  downloadCSV(rows, buildExportFilename("informe_general_presentacion", periodName));
}

export function exportBetsSummaryCsv(bets: StrategicBet[], periodName: string) {
  downloadCSV(bets.map((bet) => betRow(bet, periodName)), buildExportFilename("resumen_apuestas", periodName));
}

export function exportGoalsSummaryCsv(goals: Goal[], periodName: string) {
  downloadCSV(goals.map((goal) => goalRow(goal, periodName)), buildExportFilename("resumen_metas", periodName));
}

const COMPARISON_MODE_LABEL: Record<ComparisonType, string> = {
  "period-vs-period": "Periodo vs Periodo",
  "bet-vs-bet": "Apuesta vs Apuesta",
  "goal-vs-goal": "Meta vs Meta",
  "bet-vs-goal": "Apuesta vs Meta",
};

/** Exports both recorded values side by side. No difference between them is calculated. */
export function exportComparisonCsv(params: {
  compType: ComparisonType;
  periodName: string;
  nameA: string;
  nameB: string;
  rows: ComparisonCsvRow[];
}) {
  const { compType, periodName, nameA, nameB } = params;
  const rows = params.rows.map((item) => ({
    periodo_analisis: periodName,
    modalidad: COMPARISON_MODE_LABEL[compType] ?? compType,
    entidad_A: nameA,
    entidad_B: nameB,
    metrica: item.metric,
    valor_A: item.valA,
    valor_B: item.valB,
    unidad: item.unit ?? "",
  }));

  const cleanA = nameA.replace(/\s+/g, "_").slice(0, 15);
  const cleanB = nameB.replace(/\s+/g, "_").slice(0, 15);
  downloadCSV(rows, buildExportFilename(`comparativa_${compType}`, `${cleanA}_vs_${cleanB}`));
}

export function exportSlideDeckCsv(slides: PresentationSlide[], periodName: string) {
  const rows = slides.map((slide) => {
    const content = slide.content as Record<string, any>;
    return {
      orden: slide.order,
      tipo: slide.type,
      titulo: slide.title,
      subtitulo: slide.subtitle,
      periodo: periodName,
      resumen_texto: content.summaryText ?? content.institution ?? "",
      estado: content.status ?? "",
      krs_completados: content.executionSummary?.completedKeyResults ?? content.totalKeyResults ?? "",
      iniciativas_totales: content.executionSummary?.completedProjects ?? content.totalProjects ?? "",
    };
  });

  const filename = buildExportFilename("presentacion_diapositivas", periodName);
  downloadCSV(rows, filename);
}

type DepartmentRow = ConsolidatedReport["departments"][number];
type RankingRow = ConsolidatedReport["keyResultRanking"][number];

function slideContent<T>(slides: PresentationSlide[], type: string, key: string): T[] {
  const value = (slides.find((slide) => slide.type === type)?.content as Record<string, unknown> | undefined)?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Every department and every KR of the consolidated slides; the ranking keeps the recorded-progress order. */
export function buildConsolidatedCsvRows(slides: PresentationSlide[]) {
  const departments = slideContent<DepartmentRow>(slides, "CONSOLIDATED_DEPTS_SUMMARY", "departments");
  const ranking = slideContent<RankingRow>(slides, "CONSOLIDATED_RANKING", "keyResults");
  return [
    ...departments.map((department) => ({
      seccion: "Departamentos",
      nombre: department.departmentName,
      iniciativas: department.projects,
      key_results: department.keyResults,
      krs_cerrados: department.closedKeyResults,
    })),
    ...ranking.map((keyResult, index) => ({
      seccion: "KRs por avance registrado",
      posicion: index + 1,
      nombre: keyResult.keyResultName,
      metas: (keyResult.goalNames ?? []).join("; "),
      apuestas: (keyResult.strategicBetNames ?? []).join("; "),
      periodo: keyResult.period,
      iniciativas_vinculadas: keyResult.linkedProjects,
      avance_registrado: keyResult.progressPercentage,
    })),
  ];
}

export function exportConsolidatedCsv(slides: PresentationSlide[], periodName: string) {
  downloadCSV(buildConsolidatedCsvRows(slides), buildExportFilename("presentacion_departamentos_krs", periodName));
}

export function exportDetailModalCsv(
  entity: { type: "bet"; data: StrategicBet } | { type: "goal"; data: Goal },
  periodName: string,
) {
  const item = entity.data;
  const base = entity.type === "bet" ? betRow(item as StrategicBet, periodName) : goalRow(item as Goal, periodName);
  const rows = [{ ...base, fecha_creacion: item.createdAt ?? "" }];
  downloadCSV(rows, buildExportFilename(`ficha_${entity.type}`, item.name.slice(0, 20)));
}

export function printPresentationView(
  title: string,
  options: { subtitle?: string; printableSelector?: string } = {},
) {
  printPDF(title, options);
}
