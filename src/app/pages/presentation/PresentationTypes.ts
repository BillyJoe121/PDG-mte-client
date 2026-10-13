import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { apuestas as mockApuestas, metas as mockMetas, okrs as mockOkrs } from "../../data/mockData";

export type PresentationMode = "hub" | "general" | "compare" | "slides";
export type ComparisonType = "bet-vs-bet" | "goal-vs-goal" | "bet-vs-goal" | "period-vs-period";

export interface SelectedEntityDetail {
  type: "bet" | "goal";
  id: number;
}

export interface PeriodComparisonStats {
  periodName: string;
  totalKeyResults: number;
  completedKeyResults: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  averageKeyResultCoverage: number;
}

export const PRESENTATION_COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4B83D",
  red: "#DC2626",
  purple: "#7C3AED",
  teal: "#0D9488",
  navy: "#222245",
  textMuted: "#717182",
  border: "#DFE3EC",
  bgSubtle: "#F7F8FC",
  cardBg: "#FFFFFF",
};

/**
 * Formats any number or numeric string to at most 2 decimal places.
 * Eliminates floating point arithmetic noise (e.g. 18.959999999999997 -> "18.96").
 * Omits trailing zeros for whole numbers (e.g. 10 -> "10", 18.9 -> "18.9", 18.96 -> "18.96").
 */
export function formatMax2Decimals(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "number" ? value : parseFloat(String(value).replace("%", ""));
  if (Number.isNaN(num)) return "0";
  return Number(num.toFixed(2)).toString();
}

export function formatPercentMax2Decimals(value: number | string | null | undefined): string {
  return `${formatMax2Decimals(value)}%`;
}

export function getEffectiveBets(bets?: StrategicBet[]): StrategicBet[] {
  if (bets && bets.length > 0) return bets;

  // Fallback a mockData enriquecido si la API no tiene apuestas cargadas
  return mockApuestas.map((a, idx) => {
    const betOkrs = mockOkrs.filter((o) => o.apuestaId === a.id);
    const allKrs = betOkrs.flatMap((o) => o.keyResults);
    const completedKrs = allKrs.filter((k) => k.estado === "superado" || (k.valorActual >= k.valorObjetivo && k.valorObjetivo > 0)).length;
    const inProgressKrs = Math.max(0, allKrs.length - completedKrs);
    const totalProj = betOkrs.reduce((acc, o) => acc + (o.proyectoIds?.length ?? 0), 0);

    return {
      id: Number(a.id.replace(/\D/g, "")) || idx + 1,
      name: a.nombre,
      description: a.descripcion,
      startDate: a.fechaInicio,
      endDate: a.fechaCierre,
      status: a.estado === "activa" ? "ACTIVA" : "INACTIVA",
      createdAt: a.fechaInicio,
      executionSummary: {
        summaryText: `${completedKrs} KRs completados y ${inProgressKrs} en curso`,
        completedKeyResults: completedKrs || (idx === 0 ? 5 : 3),
        inProgressKeyResults: inProgressKrs || (idx === 0 ? 3 : 4),
        completedProjects: Math.floor(totalProj / 2) || 3,
        inProgressProjects: Math.ceil(totalProj / 2) || 2,
        periods: [],
      },
    };
  });
}

export function getEffectiveGoals(goals?: Goal[]): Goal[] {
  if (goals && goals.length > 0) return goals;

  // Fallback a mockData enriquecido si la API no tiene metas cargadas
  return mockMetas.map((m, idx) => {
    const goalOkrs = mockOkrs.filter((o) => o.metaId === m.id);
    const allKrs = goalOkrs.flatMap((o) => o.keyResults);
    const completedKrs = allKrs.filter((k) => k.estado === "superado" || (k.valorActual >= k.valorObjetivo && k.valorObjetivo > 0)).length;
    const inProgressKrs = Math.max(0, allKrs.length - completedKrs);
    const totalProj = goalOkrs.reduce((acc, o) => acc + (o.proyectoIds?.length ?? 0), 0);

    return {
      id: Number(m.id.replace(/\D/g, "")) || idx + 1,
      name: m.nombre,
      description: m.descripcion,
      referenceIndicator: m.metricaReferencia ?? "Índice de efectividad institucional",
      expectedValue: m.valorEsperado ?? 85,
      measurementUnitId: 1,
      measurementUnitName: m.unidadMedida ?? "Porcentaje",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: m.estado === "activa" ? "ACTIVA" : "INACTIVA",
      createdAt: "2026-01-01",
      periods: [],
      executionSummary: {
        summaryText: `${allKrs.length} KRs vinculados a la meta`,
        completedKeyResults: completedKrs || (idx === 0 ? 4 : 3),
        inProgressKeyResults: inProgressKrs || (idx === 0 ? 2 : 3),
        completedProjects: Math.floor(totalProj / 2) || 2,
        inProgressProjects: Math.ceil(totalProj / 2) || 3,
        periods: [],
      },
    };
  });
}

/** Avance de una apuesta: proporcion de KRs completados sobre los KRs en seguimiento. */
export function calcBetProgress(bet: StrategicBet): number {
  const comp = bet.executionSummary?.completedKeyResults ?? 0;
  const inProg = bet.executionSummary?.inProgressKeyResults ?? 0;
  const total = comp + inProg;
  if (total === 0) return 0;
  return Math.min(100, Math.round((comp / total) * 100));
}

/** Avance de una meta: proporcion de KRs completados sobre los KRs en seguimiento. */
export function calcGoalProgress(goal: Goal): number {
  const comp = goal.executionSummary?.completedKeyResults ?? 0;
  const inProg = goal.executionSummary?.inProgressKeyResults ?? 0;
  const total = comp + inProg;
  if (total > 0) {
    return Math.min(100, Math.round((comp / total) * 100));
  }
  return 0;
}
