import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as exportUtils from "../../utils/exportUtils";
import {
  exportBetsSummaryCsv,
  exportComparisonCsv,
  exportDetailModalCsv,
  exportGeneralReportCsv,
  exportGoalsSummaryCsv,
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
    expect(rows[0]).not.toHaveProperty("cumplimiento_porcentaje");
    expect(rows[0]).not.toHaveProperty("posicion");
    expect(rows[1].krs_completados).toBe(6);
  });

  it("exports the bets summary with recorded counts and no position or progress", () => {
    exportBetsSummaryCsv(mockBets, "2026-1");

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("resumen_apuestas");
    expect(rows).toHaveLength(1);
    expect(rows[0].categoria).toBe("Apuesta Estratégica");
    expect(rows[0].krs_completados).toBe(8);
    expect(rows[0].iniciativas_en_progreso).toBe(1);
    expect(rows[0]).not.toHaveProperty("posicion");
    expect(rows[0]).not.toHaveProperty("cumplimiento_porcentaje");
    expect(rows[0]).not.toHaveProperty("objetivos_completados");
  });

  it("exports the goals summary with the recorded expected value", () => {
    exportGoalsSummaryCsv(mockGoals, "2026-1");

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("resumen_metas");
    expect(rows).toHaveLength(1);
    expect(rows[0].categoria).toBe("Meta Institucional");
    expect(rows[0].valor_esperado).toBe(85);
    expect(rows[0]).not.toHaveProperty("posicion");
    expect(rows[0]).not.toHaveProperty("cumplimiento_porcentaje");
  });

  it("exports entity comparison values side by side without a difference column", () => {
    exportComparisonCsv({
      compType: "bet-vs-bet",
      periodName: "2026-1",
      nameA: "Apuesta A",
      nameB: "Apuesta B",
      rows: [
        { metric: "KRs completados", valA: 4, valB: 2, unit: "KRs" },
        { metric: "Iniciativas en curso", valA: 1, valB: 3, unit: "Iniciativas" },
      ],
    });

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("comparativa_bet-vs-bet");
    expect(rows).toHaveLength(2);
    expect(rows[0].metrica).toBe("KRs completados");
    expect(rows[0].valor_A).toBe(4);
    expect(rows[0].valor_B).toBe(2);
    expect(rows[0].modalidad).toBe("Apuesta vs Apuesta");
    expect(rows[0]).not.toHaveProperty("diferencial");
  });

  it("exports period-vs-period comparison rows with recorded counts only", () => {
    exportComparisonCsv({
      compType: "period-vs-period",
      periodName: "2026-1",
      nameA: "2026-1",
      nameB: "2025-2",
      rows: [
        { metric: "KRs totales", valA: 20, valB: 18, unit: "KRs" },
        { metric: "KRs cerrados", valA: 15, valB: 12, unit: "KRs" },
      ],
    });

    expect(downloadCsvSpy).toHaveBeenCalledOnce();
    const [rows, filename] = downloadCsvSpy.mock.calls[0];
    expect(filename).toContain("comparativa_period-vs-period");
    expect(rows.map((row: any) => row.metrica)).toEqual(["KRs totales", "KRs cerrados"]);
    expect(rows[0].modalidad).toBe("Periodo vs Periodo");
    expect(rows[0].entidad_A).toBe("2026-1");
    expect(rows[0].entidad_B).toBe("2025-2");
    expect(rows.some((row: any) => /cobertura/i.test(row.metrica))).toBe(false);
  });

  it("exports slide deck outline to CSV", () => {
    const slides: PresentationSlide[] = [
      { order: 1, type: "COVER", title: "Portada", subtitle: "2026-1", content: { institution: "Icesi" } },
      { order: 2, type: "CONSOLIDATED_SUMMARY", title: "Información General del Corte", subtitle: "Resumen", content: { summaryText: "Info" } },
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
    expect(downloadCsvSpy.mock.calls[1][0][0]).not.toHaveProperty("cumplimiento");
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
