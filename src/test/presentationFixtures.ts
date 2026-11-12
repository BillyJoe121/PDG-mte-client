import type { ConsolidatedReport, PresentationSlide } from "../app/services/reportsApi";
import type { Goal, StrategicBet } from "../app/services/strategicApi";

type Summary = NonNullable<StrategicBet["executionSummary"]>;

export function executionSummary(overrides: Partial<Summary> = {}): Summary {
  return {
    summaryText: "",
    completedKeyResults: 2,
    inProgressKeyResults: 1,
    completedProjects: 3,
    inProgressProjects: 1,
    periods: [],
    ...overrides,
  } as Summary;
}

export function makeBet(id: number, name: string, overrides: Record<string, unknown> = {}): StrategicBet {
  return {
    id,
    name,
    description: `Descripcion de ${name}`,
    status: "ACTIVA",
    createdAt: "2026-01-01",
    executionSummary: executionSummary(),
    ...overrides,
  } as unknown as StrategicBet;
}

export function makeGoal(id: number, name: string, overrides: Record<string, unknown> = {}): Goal {
  return {
    id,
    name,
    description: `Descripcion de ${name}`,
    referenceIndicator: "Indicador",
    expectedValue: 80,
    measurementUnitId: 1,
    measurementUnitName: "Porcentaje",
    status: "ACTIVA",
    createdAt: "2026-01-01",
    periods: [],
    executionSummary: executionSummary(),
    ...overrides,
  } as unknown as Goal;
}

export function makeSlide(type: string, title: string, content: Record<string, unknown> = {}, order = 1): PresentationSlide {
  return { order, type, title, subtitle: "", content };
}

export function makeKeyResultRow(id: number, name: string, progress: string | number, extra: Record<string, unknown> = {}) {
  return {
    keyResultId: id,
    keyResultName: name,
    goalNames: [],
    strategicBetNames: [],
    period: "2026-1",
    progressPercentage: progress,
    linkedProjects: 1,
    ...extra,
  };
}

export function makeConsolidatedReport(overrides: Record<string, unknown> = {}): ConsolidatedReport {
  return {
    general: {
      period: "2026-1",
      departmentId: null,
      totalProjects: 4,
      activeProjects: 3,
      completedProjects: 1,
      totalKeyResults: 6,
      activeKeyResults: 5,
      closedKeyResults: 1,
    },
    departments: [],
    keyResultRanking: [],
    ...overrides,
  } as unknown as ConsolidatedReport;
}

/** Response shape returned by the presentation screen loader. */
export function makePresentationScreen(overrides: Record<string, unknown> = {}) {
  return {
    periods: [
      { id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" },
      { id: 2, name: "2025-2", status: "CERRADO", startDate: "2025-07-01", endDate: "2025-12-31" },
    ],
    presentation: {
      period: "2026-1",
      title: "Modo presentacion",
      controls: {
        fullscreenEnabled: true,
        keyboardNavigationEnabled: true,
        nextKeys: ["ArrowRight", "Space"],
        previousKeys: ["ArrowLeft"],
        exitKeys: ["Escape"],
      },
      slides: [
        makeSlide("COVER", "Portada", {}, 1),
        makeSlide("CLOSING", "Cierre", { summaryText: "Cierre del periodo" }, 2),
      ],
    },
    bets: [makeBet(1, "Apuesta uno")],
    goals: [makeGoal(1, "Meta uno")],
    consolidatedReport: null,
    ...overrides,
  };
}
