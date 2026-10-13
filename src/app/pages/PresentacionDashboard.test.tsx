import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadPresentationScreen: vi.fn(),
  downloadCSV: vi.fn(),
  printPDF: vi.fn(),
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

import { PresentacionDashboard } from "./PresentacionDashboard";

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

  it("navigates to Option 1 (Informe General), shows rankings and opens detail modal on click", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    const generalBtn = await screen.findByRole("button", { name: /explorar informe general/i });
    fireEvent.click(generalBtn);

    expect(await screen.findByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();
    expect(screen.getByText(/comparativa: apuestas estrat[eé]gicas vs apuestas estrat[eé]gicas/i)).toBeInTheDocument();
    expect(screen.getByText(/comparativa: metas institucionales vs metas institucionales/i)).toBeInTheDocument();

    // Verify Rankings are rendered at the end of their respective sections
    expect(screen.getByRole("heading", { name: /ranking de rendimiento: apuestas estrat[eé]gicas/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ranking de rendimiento: metas institucionales/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ranking de apuestas estrat[eé]gicas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ranking de metas institucionales/i)).toBeInTheDocument();

    // Verify podium positions
    expect(screen.getAllByText("🥇").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("🥈").length).toBeGreaterThanOrEqual(2);

    // Click "Detalle" button in ranking table
    const rankingDetailBtns = screen.getAllByRole("button", { name: /detalle/i });
    expect(rankingDetailBtns.length).toBeGreaterThan(0);
    fireEvent.click(rankingDetailBtns[0]);

    // Modal dialog opens
    const modalDialog = await screen.findByRole("dialog");
    expect(modalDialog).toBeInTheDocument();
    expect(within(modalDialog).getByRole("heading", { name: /transformaci[oó]n digital e inteligencia artificial/i })).toBeInTheDocument();

    // Close modal
    fireEvent.click(within(modalDialog).getByRole("button", { name: /cerrar ventana modal/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navigates to Option 2 (Comparar) and switches comparison modes including period-vs-period", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    const compareBtn = await screen.findByRole("button", { name: /abrir modo comparar/i });
    fireEvent.click(compareBtn);

    expect(await screen.findByRole("heading", { name: /comparativa de desempe[nñ]o estrat[eé]gico/i })).toBeInTheDocument();

    // Check modes
    const betVsBetBtn = screen.getByRole("button", { name: /apuesta vs apuesta/i });
    const goalVsGoalBtn = screen.getByRole("button", { name: /meta vs meta/i });
    const betVsGoalBtn = screen.getByRole("button", { name: /apuesta vs meta/i });
    const periodVsPeriodBtn = screen.getByRole("button", { name: /periodo vs periodo/i });

    expect(betVsBetBtn).toBeInTheDocument();
    expect(goalVsGoalBtn).toBeInTheDocument();
    expect(betVsGoalBtn).toBeInTheDocument();
    expect(periodVsPeriodBtn).toBeInTheDocument();

    // Switch to Meta vs Meta
    fireEvent.click(goalVsGoalBtn);
    expect(screen.getAllByText(/meta a/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/meta b/i).length).toBeGreaterThan(0);

    // Switch to Apuesta vs Meta
    fireEvent.click(betVsGoalBtn);
    expect(screen.getAllByText(/apuesta a/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/meta b/i).length).toBeGreaterThan(0);

    // Switch to Periodo vs Periodo
    await act(async () => {
      fireEvent.click(periodVsPeriodBtn);
    });

    expect(screen.getByText(/periodo base \(a\)/i)).toBeInTheDocument();
    expect(screen.getByText(/periodo de comparaci[oó]n \(b\)/i)).toBeInTheDocument();
    expect(screen.getByText(/periodo acad[eé]mico 2026-1/i)).toBeInTheDocument();
    expect(screen.getByText(/periodo acad[eé]mico 2025-2/i)).toBeInTheDocument();
    expect(screen.getByText(/m[eé]tricas institucionales comparadas entre periodo 2026-1 y periodo 2025-2/i)).toBeInTheDocument();
    expect(screen.getByText(/an[aá]lisis cuantitativo de variaci[oó]n entre periodo 2026-1 y periodo 2025-2/i)).toBeInTheDocument();

    // Swap periods
    const swapBtn = screen.getByRole("button", { name: /intercambiar periodos/i });
    await act(async () => {
      fireEvent.click(swapBtn);
    });

    expect(screen.getByText(/m[eé]tricas institucionales comparadas entre periodo 2025-2 y periodo 2026-1/i)).toBeInTheDocument();
    expect(screen.getByText(/an[aá]lisis cuantitativo de variaci[oó]n entre periodo 2025-2 y periodo 2026-1/i)).toBeInTheDocument();
  });

  it("navigates to slide deck mode and presents the 7 consolidated slides followed by bets", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage(["/presentacion?modo=slides"]);

    // Slide 1: Cover
    expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();
    expect(screen.getByText("1 / 10")).toBeInTheDocument();

    // Slide 2: Diapositiva 1 del consolidado (4 píldoras de info general)
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Información General del Corte" })).toBeInTheDocument();
    expect(screen.getByText("2 / 10")).toBeInTheDocument();
    expect(screen.getByText("Total del corte")).toBeInTheDocument();
    expect(screen.getByText("Cierres documentados")).toBeInTheDocument();
    expect(screen.getByText("KRs incluidos")).toBeInTheDocument();
    expect(screen.queryByText(/objetivos incluidos/i)).not.toBeInTheDocument();
    expect(screen.getByText("Cobertura reportada")).toBeInTheDocument();

    // Slide 3: Diapositiva 2 del consolidado (Lectura ejecutiva del corte)
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Lectura Ejecutiva del Corte" })).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
    expect(screen.getByText("Iniciativas Activas")).toBeInTheDocument();
    expect(screen.getByText("Tasa de Cierres")).toBeInTheDocument();
    expect(screen.getByText("KRs Trazables")).toBeInTheDocument();

    // Slide 4: Diapositiva 3 del consolidado (Salud de cobertura)
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Salud de Cobertura Estratégica" })).toBeInTheDocument();
    expect(screen.getByText("4 / 10")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bandas de Cobertura" })).toBeInTheDocument();

    // Slide 5: Diapositiva 4 del consolidado (Capacidad institucional)
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Capacidad Institucional" })).toBeInTheDocument();
    expect(screen.getByText("5 / 10")).toBeInTheDocument();
    expect(screen.getByText("Iniciativas / Depto.")).toBeInTheDocument();
    expect(screen.getByText("KRs / Depto.")).toBeInTheDocument();

    // Slide 6: Diapositiva 5 del consolidado (Departamentos con mayor avance)
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Departamentos con Mayor Avance" })).toBeInTheDocument();
    expect(screen.getByText("6 / 10")).toBeInTheDocument();
    expect(screen.getByText(/ranking de unidades acad[eé]micas/i)).toBeInTheDocument();

    // Slide 7: Diapositiva 6 del consolidado (KRs que requieren atención)
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "KRs que Requieren Atención" })).toBeInTheDocument();
    expect(screen.getByText("7 / 10")).toBeInTheDocument();
    expect(screen.getByText(/KRs cr[ií]ticos para seguimiento/i)).toBeInTheDocument();

    // Slide 8: Diapositiva 7 del consolidado (Resumen por departamento)
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Resumen por Departamento" })).toBeInTheDocument();
    expect(screen.getByText("8 / 10")).toBeInTheDocument();
    expect(screen.getByLabelText(/resumen por departamento/i)).toBeInTheDocument();

    // Slide 9: Primera apuesta estratégica individual
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Transformación educativa" })).toBeInTheDocument();
    expect(screen.getByText("9 / 10")).toBeInTheDocument();

    // Slide 10: Diapositiva de Cierre
    await act(async () => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(await screen.findByRole("heading", { name: "Cierre" })).toBeInTheDocument();
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
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

  it("allows downloading CSV and exporting PDF from header, general report, rankings, comparison, slides, and detail modal", async () => {
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

    // 2. Option 1: General Report view and rankings
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

    // Bets ranking export buttons
    const betsRankingPdfBtn = screen.getByRole("button", { name: "Exportar ranking de apuestas a PDF" });
    const betsRankingCsvBtn = screen.getByRole("button", { name: "Descargar ranking de apuestas en CSV" });

    fireEvent.click(betsRankingPdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Ranking de Apuestas Estratégicas",
      expect.objectContaining({ printableSelector: ".presentation-bets-ranking-card" })
    );

    fireEvent.click(betsRankingCsvBtn);
    expect(mocks.downloadCSV).toHaveBeenCalled();

    // Goals ranking export buttons
    const goalsRankingPdfBtn = screen.getByRole("button", { name: "Exportar ranking de metas a PDF" });
    const goalsRankingCsvBtn = screen.getByRole("button", { name: "Descargar ranking de metas en CSV" });

    fireEvent.click(goalsRankingPdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Ranking de Metas Institucionales",
      expect.objectContaining({ printableSelector: ".presentation-goals-ranking-card" })
    );

    fireEvent.click(goalsRankingCsvBtn);
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
    expect(await screen.findByRole("heading", { name: /comparativa de desempe[nñ]o estrat[eé]gico/i })).toBeInTheDocument();

    const comparePdfBtn = screen.getByRole("button", { name: "Exportar comparativa a PDF" });
    const compareCsvBtn = screen.getByRole("button", { name: "Descargar datos de la comparativa en CSV" });

    fireEvent.click(comparePdfBtn);
    expect(mocks.printPDF).toHaveBeenCalledWith(
      "Comparativa de Desempeño Estratégico",
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
