import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as exportUtils from "../../utils/exportUtils";
import {
  exportComparisonCsv,
  exportDetailModalCsv,
  exportGeneralReportCsv,
  exportRankingBetsCsv,
  exportRankingGoalsCsv,
  exportSlideDeckCsv,
  printPresentationView,
} from "./presentationExportUtils";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { PresentationSlide } from "../../services/reportsApi";

describe("presentationExportUtils", () => {
  let downloadCsvSpy: any;
  let printPdfSpy: any;

  const mockBets: StrategicBet[] = [
    {
      id: 1,
      name: "Transformación Digital e Inteligencia Artificial",
      description: "Modernización tecnológica.",
      status: "ACTIVA",
      createdAt: "2026-01-01",
      executionSummary: {
        summaryText: "Buen avance",
        completedKeyResults: 8,
        inProgressKeyResults: 2,
        completedProjects: 4,
        inProgressProjects: 1,
        periods: [],
      },
    },
  ];

  const mockGoals: Goal[] = [
    {
      id: 1,
      name: "Graduación Oportuna y Éxito Estudiantil",
      description: "Tasa de graduación.",
      referenceIndicator: "Graduación efectiva",
      expectedValue: 85,
      measurementUnitId: 1,
      measurementUnitName: "%",
      periods: [],
      status: "ACTIVA",
      createdAt: "2026-01-01",
      executionSummary: {
        summaryText: "Alineada",
        completedKeyResults: 6,
        inProgressKeyResults: 1,
        completedProjects: 3,
        inProgressProjects: 1,
        periods: [],
      },
    },
  ];

  beforeEach(() => {
    downloadCsvSpy = vi.spyOn(exportUtils, "downloadCSV").mockImplementation(() => {});
    printPdfSpy = vi.spyOn(exportUtils, "printPDF").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports general report data to CSV", () => {
    exportGeneralReportCsv(mockBets, mockGoals, "2026-1");

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("informe_general_presentacion");
    expect(rows).toHaveLength(2);
    expect(rows[0].categoria).toBe("Apuesta Estratégica");
    expect(rows[0].nombre).toBe("Transformación Digital e Inteligencia Artificial");
    expect(rows[1].categoria).toBe("Meta Institucional");
    expect(rows[1].nombre).toBe("Graduación Oportuna y Éxito Estudiantil");
  });

  it("exports strategic bets ranking to CSV", () => {
    exportRankingBetsCsv(mockBets, "2026-1");

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("ranking_apuestas");
    expect(rows).toHaveLength(1);
    expect(rows[0].posicion).toBe(1);
    expect(rows[0].tipo).toBe("Apuesta Estratégica");
    expect(rows[0].krs_completados).toBe(8);
    expect(rows[0].iniciativas_totales).toBe(5);
    expect(rows[0]).not.toHaveProperty("objetivos_completados");
  });

  it("exports institutional goals ranking to CSV", () => {
    exportRankingGoalsCsv(mockGoals, "2026-1");

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("ranking_metas");
    expect(rows).toHaveLength(1);
    expect(rows[0].posicion).toBe(1);
    expect(rows[0].tipo).toBe("Meta Institucional");
    expect(rows[0].valor_esperado).toBe(85);
  });

  it("exports entity comparison data to CSV", () => {
    exportComparisonCsv({
      compType: "bet-vs-bet",
      periodName: "2026-1",
      nameA: "Apuesta A",
      nameB: "Apuesta B",
      deltaRows: [
        { metric: "Cumplimiento", valA: "80%", valB: "70%", delta: 10, unit: "%" },
        { metric: "KRs", valA: 4, valB: 2, delta: 2, unit: "KRs" },
      ],
    });

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("comparativa_bet-vs-bet");
    expect(rows).toHaveLength(2);
    expect(rows[0].metrica).toBe("Cumplimiento");
    expect(rows[0].diferencial).toBe("+10");
  });

  it("exports period-vs-period comparison data to CSV with institutional metrics", () => {
    exportComparisonCsv({
      compType: "period-vs-period",
      periodName: "2026-1",
      nameA: "2026-1",
      nameB: "2025-2",
      deltaRows: [],
      periodStatsA: {
        periodName: "2026-1",
        totalKeyResults: 20,
        completedKeyResults: 15,
        totalProjects: 10,
        completedProjects: 7,
        activeProjects: 3,
        averageKeyResultCoverage: 75,
      },
      periodStatsB: {
        periodName: "2025-2",
        totalKeyResults: 18,
        completedKeyResults: 12,
        totalProjects: 8,
        completedProjects: 5,
        activeProjects: 3,
        averageKeyResultCoverage: 65,
      },
    });

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("comparativa_period-vs-period");
    expect(rows.map((row: any) => row.metrica)).toEqual([
      "Key Results Totales",
      "Key Results Completados",
      "Iniciativas Completadas",
      "Cobertura Promedio KRs",
    ]);
    expect(rows[0].modalidad).toBe("Periodo vs Periodo");
  });

  it("formats decimal values with max 2 decimals avoiding floating point artifacts in period comparison", () => {
    exportComparisonCsv({
      compType: "period-vs-period",
      periodName: "2026-1",
      nameA: "2026-1",
      nameB: "2025-2",
      deltaRows: [],
      periodStatsA: {
        periodName: "2026-1",
        totalKeyResults: 15,
        completedKeyResults: 10,
        totalProjects: 8,
        completedProjects: 5,
        activeProjects: 3,
        averageKeyResultCoverage: 54.45,
      },
      periodStatsB: {
        periodName: "2025-2",
        totalKeyResults: 14,
        completedKeyResults: 9,
        totalProjects: 8,
        completedProjects: 4,
        activeProjects: 4,
        averageKeyResultCoverage: 30.71,
      },
    });

    const [rows] = downloadCsvSpy.mock.calls[0];
    const krRow = rows.find((r: any) => r.metrica === "Cobertura Promedio KRs");

    // 54.45 - 30.71 = 23.74 (not 23.740000000000002%)
    expect(krRow.valor_A).toBe("54.45%");
    expect(krRow.valor_B).toBe("30.71%");
    expect(krRow.diferencial).toBe("23.74%");
  });

  it("exports slide deck outline to CSV", () => {
    const slides: PresentationSlide[] = [
      { order: 1, type: "COVER", title: "Portada", subtitle: "2026-1", content: { institution: "Icesi" } },
      { order: 2, type: "CONSOLIDATED_PILLS", title: "4 Píldoras", subtitle: "Resumen", content: { summaryText: "Info" } },
    ];

    exportSlideDeckCsv(slides, "2026-1");

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("presentacion_diapositivas");
    expect(rows).toHaveLength(2);
    expect(rows[0].titulo).toBe("Portada");
  });

  it("exports detail modal technical sheet to CSV for bet and goal", () => {
    exportDetailModalCsv({ type: "bet", data: mockBets[0] }, "2026-1");
    expect(downloadCsvSpy).toHaveBeenCalledTimes(1);
    expect(downloadCsvSpy.mock.calls[0][1]).toContain("ficha_bet");

    exportDetailModalCsv({ type: "goal", data: mockGoals[0] }, "2026-1");
    expect(downloadCsvSpy).toHaveBeenCalledTimes(2);
    expect(downloadCsvSpy.mock.calls[1][1]).toContain("ficha_goal");
  });

  it("delegates printPresentationView to printPDF with options", () => {
    printPresentationView("Vista de Prueba", {
      subtitle: "Subtítulo",
      printableSelector: ".test-selector",
    });

    expect(printPdfSpy).toHaveBeenCalledWith("Vista de Prueba", {
      subtitle: "Subtítulo",
      printableSelector: ".test-selector",
    });
  });
});
