import { buildExportFilename, downloadCSV, printPDF } from "../../utils/exportUtils";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { PresentationSlide } from "../../services/reportsApi";
import { calcBetProgress, calcGoalProgress, type ComparisonType, formatMax2Decimals, type PeriodComparisonStats } from "./PresentationTypes";

export function exportGeneralReportCsv(
  bets: StrategicBet[],
  goals: Goal[],
  periodName: string,
) {
  const rows: Record<string, string | number>[] = [];

  // Apuestas
  bets.forEach((bet, idx) => {
    const progress = calcBetProgress(bet);
    const summary = bet.executionSummary;
    rows.push({
      categoria: "Apuesta Estratégica",
      posicion: idx + 1,
      id: bet.id,
      nombre: bet.name,
      periodo: periodName,
      estado: bet.status,
      cumplimiento_porcentaje: `${progress}%`,
      krs_completados: summary?.completedKeyResults ?? 0,
      krs_en_progreso: summary?.inProgressKeyResults ?? 0,
      iniciativas_completadas: summary?.completedProjects ?? 0,
      iniciativas_en_progreso: summary?.inProgressProjects ?? 0,
      descripcion: bet.description ?? "",
    });
  });

  // Metas
  goals.forEach((goal, idx) => {
    const progress = calcGoalProgress(goal);
    const summary = goal.executionSummary;
    rows.push({
      categoria: "Meta Institucional",
      posicion: idx + 1,
      id: goal.id,
      nombre: goal.name,
      periodo: periodName,
      estado: goal.status,
      cumplimiento_porcentaje: `${progress}%`,
      valor_esperado: goal.expectedValue ?? "",
      unidad_medida: goal.measurementUnitName ?? "",
      indicador_referencia: goal.referenceIndicator ?? "",
      krs_completados: summary?.completedKeyResults ?? 0,
      krs_en_progreso: summary?.inProgressKeyResults ?? 0,
      iniciativas_completadas: summary?.completedProjects ?? 0,
      iniciativas_en_progreso: summary?.inProgressProjects ?? 0,
      descripcion: goal.description ?? "",
    });
  });

  const filename = buildExportFilename("informe_general_presentacion", periodName);
  downloadCSV(rows, filename);
}

export function exportRankingBetsCsv(rankedBets: StrategicBet[], periodName: string) {
  const rows = rankedBets.map((bet, idx) => {
    const progress = calcBetProgress(bet);
    const summary = bet.executionSummary;
    return {
      posicion: idx + 1,
      tipo: "Apuesta Estratégica",
      id: bet.id,
      nombre: bet.name,
      periodo: periodName,
      estado: bet.status,
      cumplimiento_porcentaje: `${progress}%`,
      krs_completados: summary?.completedKeyResults ?? 0,
      iniciativas_totales: (summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0),
      descripcion: bet.description ?? "",
    };
  });

  const filename = buildExportFilename("ranking_apuestas", periodName);
  downloadCSV(rows, filename);
}

export function exportRankingGoalsCsv(rankedGoals: Goal[], periodName: string) {
  const rows = rankedGoals.map((goal, idx) => {
    const progress = calcGoalProgress(goal);
    const summary = goal.executionSummary;
    return {
      posicion: idx + 1,
      tipo: "Meta Institucional",
      id: goal.id,
      nombre: goal.name,
      periodo: periodName,
      estado: goal.status,
      cumplimiento_porcentaje: `${progress}%`,
      valor_esperado: goal.expectedValue ?? "",
      unidad_medida: goal.measurementUnitName ?? "",
      indicador_referencia: goal.referenceIndicator ?? "",
      krs_completados: summary?.completedKeyResults ?? 0,
      descripcion: goal.description ?? "",
    };
  });

  const filename = buildExportFilename("ranking_metas", periodName);
  downloadCSV(rows, filename);
}

export function exportComparisonCsv(params: {
  compType: ComparisonType;
  periodName: string;
  nameA: string;
  nameB: string;
  deltaRows: { metric: string; valA: number | string; valB: number | string; delta: number; unit?: string }[];
  periodStatsA?: PeriodComparisonStats;
  periodStatsB?: PeriodComparisonStats;
}) {
  const { compType, periodName, nameA, nameB, deltaRows, periodStatsA, periodStatsB } = params;
  const rows: Record<string, string | number>[] = [];

  if (compType === "period-vs-period" && periodStatsA && periodStatsB) {
    rows.push({
      periodo_analisis: periodName,
      modalidad: "Periodo vs Periodo",
      entidad_base_A: periodStatsA.periodName,
      entidad_comparada_B: periodStatsB.periodName,
      metrica: "Key Results Totales",
      valor_A: periodStatsA.totalKeyResults,
      valor_B: periodStatsB.totalKeyResults,
      diferencial: periodStatsA.totalKeyResults - periodStatsB.totalKeyResults,
      unidad: "KRs",
    });
    rows.push({
      periodo_analisis: periodName,
      modalidad: "Periodo vs Periodo",
      entidad_base_A: periodStatsA.periodName,
      entidad_comparada_B: periodStatsB.periodName,
      metrica: "Key Results Completados",
      valor_A: periodStatsA.completedKeyResults,
      valor_B: periodStatsB.completedKeyResults,
      diferencial: periodStatsA.completedKeyResults - periodStatsB.completedKeyResults,
      unidad: "KRs",
    });
    rows.push({
      periodo_analisis: periodName,
      modalidad: "Periodo vs Periodo",
      entidad_base_A: periodStatsA.periodName,
      entidad_comparada_B: periodStatsB.periodName,
      metrica: "Iniciativas Completadas",
      valor_A: periodStatsA.completedProjects,
      valor_B: periodStatsB.completedProjects,
      diferencial: periodStatsA.completedProjects - periodStatsB.completedProjects,
      unidad: "Iniciativas",
    });
    rows.push({
      periodo_analisis: periodName,
      modalidad: "Periodo vs Periodo",
      entidad_base_A: periodStatsA.periodName,
      entidad_comparada_B: periodStatsB.periodName,
      metrica: "Cobertura Promedio KRs",
      valor_A: `${formatMax2Decimals(periodStatsA.averageKeyResultCoverage)}%`,
      valor_B: `${formatMax2Decimals(periodStatsB.averageKeyResultCoverage)}%`,
      diferencial: `${formatMax2Decimals(periodStatsA.averageKeyResultCoverage - periodStatsB.averageKeyResultCoverage)}%`,
      unidad: "%",
    });
  } else {
    deltaRows.forEach((item) => {
      const formattedDelta =
        typeof item.delta === "number"
          ? item.delta > 0
            ? `+${formatMax2Decimals(item.delta)}`
            : formatMax2Decimals(item.delta)
          : item.delta;

      rows.push({
        periodo_analisis: periodName,
        modalidad: compType,
        entidad_A: nameA,
        entidad_B: nameB,
        metrica: item.metric,
        valor_A: item.valA,
        valor_B: item.valB,
        diferencial: formattedDelta,
        unidad: item.unit ?? "",
      });
    });
  }

  const cleanA = nameA.replace(/\s+/g, "_").slice(0, 15);
  const cleanB = nameB.replace(/\s+/g, "_").slice(0, 15);
  const filename = buildExportFilename(`comparativa_${compType}`, `${cleanA}_vs_${cleanB}`);
  downloadCSV(rows, filename);
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

export function exportDetailModalCsv(
  entity: { type: "bet"; data: StrategicBet } | { type: "goal"; data: Goal },
  periodName: string,
) {
  const isBet = entity.type === "bet";
  const item = entity.data;
  const progress = isBet ? calcBetProgress(item as StrategicBet) : calcGoalProgress(item as Goal);
  const summary = item.executionSummary;

  const rows = [
    {
      tipo: isBet ? "Apuesta Estratégica" : "Meta Institucional",
      id: item.id,
      nombre: item.name,
      periodo: periodName,
      estado: item.status,
      cumplimiento: `${progress}%`,
      valor_esperado: (item as any).expectedValue ?? "N/A",
      unidad_medida: (item as any).measurementUnitName ?? "N/A",
      indicador_referencia: (item as any).referenceIndicator ?? "N/A",
      krs_completados: summary?.completedKeyResults ?? 0,
      krs_en_progreso: summary?.inProgressKeyResults ?? 0,
      iniciativas_completadas: summary?.completedProjects ?? 0,
      iniciativas_en_progreso: summary?.inProgressProjects ?? 0,
      fecha_creacion: item.createdAt ?? "",
      descripcion: item.description ?? "",
    },
  ];

  const filename = buildExportFilename(`ficha_${entity.type}`, item.name.slice(0, 20));
  downloadCSV(rows, filename);
}

export function printPresentationView(
  title: string,
  options: { subtitle?: string; printableSelector?: string } = {},
) {
  printPDF(title, options);
}
