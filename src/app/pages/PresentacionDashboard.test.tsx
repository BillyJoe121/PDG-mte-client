import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadPresentationScreen: vi.fn(),
  downloadCSV: vi.fn(),
  printPDF: vi.fn(),
  periodComparison: vi.fn(),
}));

vi.mock("../services/screenDataCache", () => ({
  loadPresentationScreen: mocks.loadPresentationScreen,
}));

vi.mock("../utils/exportUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/exportUtils")>();
  return {
    ...actual,
    downloadCSV: mocks.downloadCSV,
    printPDF: mocks.printPDF,
  };
});

vi.mock("../services/reportsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/reportsApi")>();
  return {
    ...actual,
    reportsApi: { ...actual.reportsApi, periodComparison: mocks.periodComparison },
  };
});

import { PresentacionDashboard } from "./PresentacionDashboard";

function periodReport(period: string, totalKeyResults: number) {
  return {
    period,
    departmentId: null,
    totalProjects: 4,
    activeProjects: 3,
    completedProjects: 1,
    totalKeyResults,
    activeKeyResults: totalKeyResults - 1,
    closedKeyResults: 1,
  };
}

const response = {
  periods: [
    { id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" },
    { id: 2, name: "2025-2", status: "CERRADO", startDate: "2025-07-01", endDate: "2025-12-31" },
  ],
  presentation: {
    period: "2026-1",
    title: "Modo presentación MTE",
    controls: {
      fullscreenEnabled: true,
      keyboardNavigationEnabled: true,
      nextKeys: ["ArrowRight", "Space"],
      previousKeys: ["ArrowLeft"],
      exitKeys: ["Escape"],
    },
    slides: [
      { order: 1, type: "COVER", title: "Seguimiento estratégico", subtitle: "Periodo 2026-1", content: { institution: "Escuela TDI", completedKeyResults: 4, inProgressKeyResults: 2 } },
      { order: 2, type: "STRATEGIC_BET", title: "Transformación educativa", subtitle: "Apuesta institucional", content: { status: "ACTIVO", executionSummary: { completedKeyResults: 3, inProgressKeyResults: 2 } } },
      { order: 3, type: "CLOSING", title: "Cierre", subtitle: "Resumen", content: { summaryText: "4 KRs completos" } },
    ],
  },
  bets: [
    {
      id: 1,
      name: "Transformación Digital e Inteligencia Artificial",
      description: "Modernización tecnológica de planes curriculares.",
      status: "ACTIVA",
      createdAt: "2026-01-01",
      executionSummary: {
        summaryText: "Avance significativo",
        completedKeyResults: 6,
        inProgressKeyResults: 3,
        completedProjects: 5,
        inProgressProjects: 2,
        periods: [],
      },
    },
    {
      id: 2,
      name: "Excelencia y Pertinencia Académica",
      description: "Fortalecimiento de acreditaciones y competencias.",
      status: "ACTIVA",
      createdAt: "2026-01-01",
      executionSummary: {
        summaryText: "En desarrollo",
        completedKeyResults: 4,
        inProgressKeyResults: 4,
        completedProjects: 4,
        inProgressProjects: 3,
        periods: [],
      },
    },
  ],
  goals: [
    {
      id: 1,
      name: "Graduación Oportuna y Éxito Estudiantil",
      description: "Incrementar retención y titulación a tiempo.",
      referenceIndicator: "Tasa de graduación efectiva",
      expectedValue: 85,
      measurementUnitId: 1,
      measurementUnitName: "Porcentaje",
      status: "ACTIVA",
      createdAt: "2026-01-01",
      periods: [],
      executionSummary: {
        summaryText: "Metas alineadas",
        completedKeyResults: 5,
        inProgressKeyResults: 2,
        completedProjects: 3,
        inProgressProjects: 2,
        periods: [],
      },
    },
    {
      id: 2,
      name: "Impacto y Visibilidad de Investigación",
      description: "Publicaciones Scopus y transferencia de conocimiento.",
      referenceIndicator: "Artículos Q1/Q2",
      expectedValue: 50,
      measurementUnitId: 2,
      measurementUnitName: "Publicaciones",
      status: "ACTIVA",
      createdAt: "2026-01-01",
      periods: [],
      executionSummary: {
        summaryText: "Producción continua",
        completedKeyResults: 3,
        inProgressKeyResults: 3,
        completedProjects: 2,
        inProgressProjects: 3,
        periods: [],
      },
    },
  ],
};

function renderPage(initialEntries = ["/presentacion"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <PresentacionDashboard />
    </MemoryRouter>
  );
}

describe("PresentacionDashboard", () => {
  beforeEach(() => {
    mocks.loadPresentationScreen.mockReset();
    mocks.periodComparison.mockReset();
    mocks.periodComparison.mockImplementation(({ basePeriod, comparePeriod }: { basePeriod: string; comparePeriod: string }) =>
      Promise.resolve({
        basePeriod,
        comparePeriod,
        base: periodReport(basePeriod, 6),
        compare: periodReport(comparePeriod, 4),
      }),
    );
  });

  it("shows a real loading state while presentation data is pending", () => {
    mocks.loadPresentationScreen.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByRole("status", { name: /cargando presentaci[oó]n/i })).toBeInTheDocument();
  });

  it("renders the presentation hub offering the 2 analysis options by default", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    expect(await screen.findByRole("heading", { name: /modo presentaci[oó]n estrat[eé]gica msp/i })).toBeInTheDocument();
    expect(screen.getByText("Opción 1")).toBeInTheDocument();
    expect(screen.getByText("Ver todas las metas y apuestas juntas")).toBeInTheDocument();
    expect(screen.getByText("Opción 2")).toBeInTheDocument();
    expect(screen.getByText("Comparar entidades estratégicas")).toBeInTheDocument();
  });

  it("navigates to Option 1 (Informe General), shows recorded summaries without rankings and opens the detail modal", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    const generalBtn = await screen.findByRole("button", { name: /explorar informe general/i });
    fireEvent.click(generalBtn);

    expect(await screen.findByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /apuestas estrat[eé]gicas del periodo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /metas institucionales del periodo/i })).toBeInTheDocument();

    // Summary tables keep the API order and show recorded counts only
    expect(screen.getByRole("heading", { name: "Resumen de Apuestas Estratégicas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen de Metas Institucionales" })).toBeInTheDocument();
    const betsTable = screen.getByRole("table", { name: "Resumen de Apuestas Estratégicas" });
    const betRows = within(betsTable).getAllByRole("row");
    expect(betRows[1]).toHaveTextContent("Transformación Digital e Inteligencia Artificial");
    expect(betRows[2]).toHaveTextContent("Excelencia y Pertinencia Académica");

    // No invented positions, medals or compliance percentages
    expect(screen.queryByText(/ranking/i)).not.toBeInTheDocument();
    expect(screen.queryByText("🥇")).not.toBeInTheDocument();
    expect(screen.queryByText(/cumplimiento/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("85 Porcentaje").length).toBeGreaterThan(0);

    const detailBtns = screen.getAllByRole("button", { name: /detalle de/i });
    expect(detailBtns.length).toBe(4);
    fireEvent.click(detailBtns[0]);

    const modalDialog = await screen.findByRole("dialog");
    expect(within(modalDialog).getByRole("heading", { name: /transformaci[oó]n digital e inteligencia artificial/i })).toBeInTheDocument();

    fireEvent.click(within(modalDialog).getByRole("button", { name: /cerrar ventana modal/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty state in Option 1 when there are no bets or goals", async () => {
    mocks.loadPresentationScreen.mockResolvedValue({ ...response, bets: [], goals: [] });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /explorar informe general/i }));

    expect(await screen.findByText("No hay apuestas ni metas registradas para este periodo")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("navigates to Option 2 (Comparar) and switches comparison modes including period-vs-period", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    const compareBtn = await screen.findByRole("button", { name: /abrir modo comparar/i });
    fireEvent.click(compareBtn);

    expect(await screen.findByRole("heading", { name: "Comparativa de registros" })).toBeInTheDocument();

    const goalVsGoalBtn = screen.getByRole("button", { name: /meta vs meta/i });
    const betVsGoalBtn = screen.getByRole("button", { name: /apuesta vs meta/i });
    const periodVsPeriodBtn = screen.getByRole("button", { name: /periodo vs periodo/i });
    expect(screen.getByRole("button", { name: /apuesta vs apuesta/i })).toBeInTheDocument();

    fireEvent.click(goalVsGoalBtn);
    expect(screen.getAllByText(/meta a/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/meta b/i).length).toBeGreaterThan(0);

    fireEvent.click(betVsGoalBtn);
    expect(screen.getAllByText(/apuesta a/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/meta b/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/cumplimiento/i)).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(periodVsPeriodBtn);
    });

    expect(screen.getByText(/periodo base \(a\)/i)).toBeInTheDocument();
    expect(screen.getByText(/periodo de comparaci[oó]n \(b\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/periodo acad[eé]mico 2026-1/i)).toBeInTheDocument();
    expect(screen.getByText(/periodo acad[eé]mico 2025-2/i)).toBeInTheDocument();
    expect(mocks.periodComparison).toHaveBeenCalledWith({ basePeriod: "2026-1", comparePeriod: "2025-2" });
    expect(screen.getByText("Valores registrados en el Periodo 2026-1 y en el Periodo 2025-2.")).toBeInTheDocument();
    expect(screen.queryByText(/cobertura|variaci[oó]n/i)).not.toBeInTheDocument();

    const swapBtn = screen.getByRole("button", { name: /intercambiar periodos/i });
    await act(async () => {
      fireEvent.click(swapBtn);
    });

    expect(await screen.findByText("Valores registrados en el Periodo 2025-2 y en el Periodo 2026-1.")).toBeInTheDocument();
  });

  it("shows an empty consolidated slide when the API returns no consolidated report", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage(["/presentacion?modo=slides"]);

    expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Reporte consolidado no disponible" })).toBeInTheDocument();
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    expect(screen.getByText("No hay reporte consolidado para el periodo 2026-1")).toBeInTheDocument();
    expect(screen.queryByLabelText(/resumen por departamento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/avance registrado/i)).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Transformación educativa" })).toBeInTheDocument();
    expect(screen.getByText("3 / 4")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Cierre" })).toBeInTheDocument();
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
  });

  it("presents the consolidated slides with recorded counts and KRs ordered by recorded progress", async () => {
    mocks.loadPresentationScreen.mockResolvedValue({
      ...response,
      consolidatedReport: {
        general: {
          period: "2026-1",
          departmentId: null,
          totalProjects: 7,
          activeProjects: 4,
          completedProjects: 3,
          totalKeyResults: 9,
          activeKeyResults: 6,
          closedKeyResults: 2,
        },
        departments: [
          { departmentId: 3, departmentName: "Ingeniería TIC", projects: 5, keyResults: 6, closedKeyResults: 1 },
        ],
        keyResultRanking: [
          { keyResultId: 10, keyResultName: "KR con menor avance", goalNames: ["Meta A"], strategicBetNames: [], period: "2026-1", progressPercentage: "25", linkedProjects: 1 },
          { keyResultId: 11, keyResultName: "KR con mayor avance", goalNames: [], strategicBetNames: ["Apuesta B"], period: "2026-1", progressPercentage: "80", linkedProjects: 2 },
        ],
      },
    });
    renderPage(["/presentacion?modo=slides"]);

    expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Información General del Corte" })).toBeInTheDocument();
    expect(screen.getByText("KRs incluidos")).toBeInTheDocument();
    expect(screen.getByText("KRs cerrados")).toBeInTheDocument();
    expect(screen.queryByText(/cobertura/i)).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "KRs por Avance Registrado" })).toBeInTheDocument();
    expect(screen.getByText("Avance registrado")).toBeInTheDocument();
    const krNames = screen.getAllByText(/KR con (mayor|menor) avance/).map((el) => el.textContent);
    expect(krNames).toEqual(["KR con mayor avance", "KR con menor avance"]);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Resumen por Departamento" })).toBeInTheDocument();
    const deptTable = screen.getByLabelText(/resumen por departamento/i);
    expect(within(deptTable).getByText("Ingeniería TIC")).toBeInTheDocument();
  });

  it("offers a retry after the API fails", async () => {
    mocks.loadPresentationScreen
      .mockRejectedValueOnce(new Error("Servicio no disponible"))
      .mockResolvedValueOnce(response);
    renderPage();

    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    await waitFor(() => expect(mocks.loadPresentationScreen).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: /modo presentaci[oó]n estrat[eé]gica msp/i })).toBeInTheDocument();
  });

  it("requests browser fullscreen when the control is available", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /pantalla completa/i }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("allows downloading CSV and exporting PDF from header, general report, summaries, comparison, slides, and detail modal", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    mocks.downloadCSV.mockClear();
    mocks.printPDF.mockClear();

    renderPage();
    await screen.findByRole("heading", { name: /modo presentaci[oó]n estrat[eé]gica msp/i });

    // 1. Persistent Top Header Export Buttons
    const headerPdfBtn = screen.getByRole("button", { name: "Exportar vista activa a PDF" });
    const headerCsvBtn = screen.getByRole("button", { name: "Descargar datos de la presentación en CSV" });

    fireEvent.click(headerPdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Modo Presentación Estratégica",
      expect.objectContaining({ printableSelector: ".presentation-print-container" })
    );

    fireEvent.click(headerCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();

    // 2. Option 1: General Report view and summaries
    const nav = screen.getByRole("navigation", { name: "Modos de presentación" });
    fireEvent.click(within(nav).getByRole("button", { name: /opci[oó]n 1: informe general/i }));
    expect(await screen.findByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();

    // General report buttons
    const reportPdfBtn = screen.getByRole("button", { name: "Exportar informe general a PDF" });
    const reportCsvBtn = screen.getByRole("button", { name: "Descargar datos del informe en CSV" });

    fireEvent.click(reportPdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Informe General de Metas y Apuestas",
      expect.objectContaining({ printableSelector: ".presentation-general-print-area" })
    );

    fireEvent.click(reportCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();

    // Bets summary export buttons
    const betsSummaryPdfBtn = screen.getByRole("button", { name: "Exportar resumen de apuestas a PDF" });
    const betsSummaryCsvBtn = screen.getByRole("button", { name: "Descargar resumen de apuestas en CSV" });

    fireEvent.click(betsSummaryPdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Resumen de Apuestas Estratégicas",
      expect.objectContaining({ printableSelector: ".presentation-bets-summary-card" })
    );

    fireEvent.click(betsSummaryCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();

    // Goals summary export buttons
    const goalsSummaryPdfBtn = screen.getByRole("button", { name: "Exportar resumen de metas a PDF" });
    const goalsSummaryCsvBtn = screen.getByRole("button", { name: "Descargar resumen de metas en CSV" });

    fireEvent.click(goalsSummaryPdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Resumen de Metas Institucionales",
      expect.objectContaining({ printableSelector: ".presentation-goals-summary-card" })
    );

    fireEvent.click(goalsSummaryCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();

    // 3. Detail Modal Export Buttons
    // Click on the first bet to open modal
    fireEvent.click(screen.getByRole("heading", { name: "Transformación Digital e Inteligencia Artificial" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    const modalPdfBtn = screen.getByRole("button", { name: "Exportar ficha técnica a PDF" });
    const modalCsvBtn = screen.getByRole("button", { name: "Descargar ficha técnica en CSV" });

    fireEvent.click(modalPdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      expect.stringContaining("Ficha Técnica"),
      expect.objectContaining({ printableSelector: ".presentation-detail-modal-content" })
    );

    fireEvent.click(modalCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();

    // Close modal
    fireEvent.click(screen.getByRole("button", { name: "Cerrar ventana modal" }));

    // 4. Option 2: Comparison View Export Buttons
    fireEvent.click(within(nav).getByRole("button", { name: /opci[oó]n 2: comparar/i }));
    expect(await screen.findByRole("heading", { name: "Comparativa de registros" })).toBeInTheDocument();

    const comparePdfBtn = screen.getByRole("button", { name: "Exportar comparativa a PDF" });
    const compareCsvBtn = screen.getByRole("button", { name: "Descargar datos de la comparativa en CSV" });

    fireEvent.click(comparePdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Comparativa de registros",
      expect.objectContaining({ printableSelector: ".presentation-comparison-print-area" })
    );

    fireEvent.click(compareCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();

    // 5. Slides View Export Buttons
    fireEvent.click(within(nav).getByRole("button", { name: "Diapositivas" }));
    expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();

    const slidePdfBtn = screen.getByRole("button", { name: "Exportar diapositiva actual a PDF" });
    const slideCsvBtn = screen.getByRole("button", { name: "Descargar estructura de diapositivas en CSV" });

    fireEvent.click(slidePdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Seguimiento estratégico",
      expect.objectContaining({ printableSelector: ".presentation-slide-print-area" })
    );

    fireEvent.click(slideCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();
  });
});
