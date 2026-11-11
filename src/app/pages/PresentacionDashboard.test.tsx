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
    expect(screen.getByRole("button", { name: /abrir informe/i })).toBeInTheDocument();
    expect(screen.getByText("Ver todas las metas y apuestas juntas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /abrir comparar/i })).toBeInTheDocument();
    expect(screen.getByText("Comparar entidades estratégicas")).toBeInTheDocument();
  });

  it("navigates to Option 1 (Informe General), shows recorded summaries without rankings and opens the detail modal", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    const generalBtn = await screen.findByRole("button", { name: /abrir informe/i });
    fireEvent.click(generalBtn);

    expect(await screen.findByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /apuestas estrat[eé]gicas del periodo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /metas institucionales del periodo/i })).toBeInTheDocument();

    // Summary tables keep the API order and show recorded counts only
    expect(screen.getByRole("table", { name: "Resumen de Metas Institucionales" })).toBeInTheDocument();
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

    fireEvent.click(await screen.findByRole("button", { name: /abrir informe/i }));

    expect(await screen.findByText("No hay apuestas ni metas registradas para este periodo")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("navigates to Option 2 (Comparar) and switches comparison modes including period-vs-period", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    const compareBtn = await screen.findByRole("button", { name: /abrir comparar/i });
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

    await screen.findByRole("heading", { name: /modo presentaci[oó]n estrat[eé]gica msp/i });
    // Fullscreen belongs to Presentar, not to the other views.
    expect(screen.queryByRole("button", { name: /pantalla completa/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /iniciar presentaci[oó]n/i }));
    fireEvent.click(await screen.findByRole("button", { name: /pantalla completa/i }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("exports every view from the single Exportar menu and keeps the detail sheet exports", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    mocks.downloadCSV.mockClear();
    mocks.printPDF.mockClear();

    renderPage();
    await screen.findByRole("heading", { name: /modo presentaci[oó]n estrat[eé]gica msp/i });
    const nav = screen.getByRole("navigation", { name: "Modos de presentación" });

    const chooseExport = (name: string) => {
      fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
      fireEvent.click(within(screen.getByRole("menu")).getByRole("menuitem", { name }));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    };

    // Resumen
    chooseExport("PDF del resumen");
    expect(mocks.printPDF).toHaveBeenLastCalledWith(
      "Modo Presentación Estratégica",
      expect.objectContaining({ printableSelector: ".presentation-print-container" })
    );
    chooseExport("CSV de apuestas y metas");
    expect(mocks.downloadCSV).toHaveBeenCalledTimes(1);

    // Informe: one menu, no export buttons inside the view
    fireEvent.click(within(nav).getByRole("button", { name: "Informe" }));
    expect(await screen.findByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /exportar informe general a pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resumen de apuestas (a pdf|en csv)/i })).not.toBeInTheDocument();

    chooseExport("PDF del informe");
    expect(mocks.printPDF).toHaveBeenLastCalledWith(
      "Informe General de Metas y Apuestas",
      expect.objectContaining({ printableSelector: ".presentation-general-print-area" })
    );
    chooseExport("CSV del informe");
    chooseExport("CSV de apuestas");
    chooseExport("CSV de metas");
    expect(mocks.downloadCSV).toHaveBeenCalledTimes(4);
    expect(mocks.downloadCSV.mock.calls[2][0]).toHaveLength(2);

    // Detail sheet keeps its own exports
    fireEvent.click(screen.getByRole("button", { name: "Detalle de Transformación Digital e Inteligencia Artificial" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Exportar ficha técnica a PDF" }));
    expect(mocks.printPDF).toHaveBeenLastCalledWith(
      expect.stringContaining("Ficha Técnica"),
      expect.objectContaining({ printableSelector: ".presentation-detail-modal-content" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Descargar ficha técnica en CSV" }));
    expect(mocks.downloadCSV).toHaveBeenCalledTimes(5);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar ventana modal" }));

    // Comparar: the CSV carries the comparison on screen, not the general report
    fireEvent.click(within(nav).getByRole("button", { name: "Comparar" }));
    expect(await screen.findByRole("heading", { name: "Comparativa de registros" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /comparativa (a pdf|en csv)/i })).not.toBeInTheDocument();

    chooseExport("PDF de la comparativa");
    expect(mocks.printPDF).toHaveBeenLastCalledWith(
      "Comparativa de registros",
      expect.objectContaining({
        printableSelector: ".presentation-comparison-print-area",
        subtitle: expect.stringContaining("Transformación Digital e Inteligencia Artificial vs Excelencia y Pertinencia Académica"),
      })
    );
    chooseExport("CSV de la comparativa");
    expect(mocks.downloadCSV).toHaveBeenCalledTimes(6);
    expect(mocks.downloadCSV.mock.calls[5][1]).toMatch(/compar/i);

    // Presentar
    fireEvent.click(within(nav).getByRole("button", { name: "Presentar" }));
    expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();

    chooseExport("PDF de la diapositiva actual");
    expect(mocks.printPDF).toHaveBeenLastCalledWith(
      "Seguimiento estratégico",
      expect.objectContaining({ printableSelector: ".presentation-slide-print-area" })
    );
    chooseExport("CSV de las diapositivas");
    expect(mocks.downloadCSV).toHaveBeenCalledTimes(7);
  });

  it("disables the comparison CSV while there is nothing to compare and closes the menu with Escape", async () => {
    mocks.loadPresentationScreen.mockResolvedValue({ ...response, bets: [] });
    renderPage(["/presentacion?modo=compare"]);
    expect(await screen.findByText("No hay apuestas estratégicas para comparar")).toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Exportar" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "CSV de la comparativa" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "PDF de la comparativa" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("menuitem", { name: "PDF de la comparativa" }), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    // Escape only closed the menu: the comparison view is still on screen.
    expect(screen.getByRole("heading", { name: "Comparativa de registros" })).toBeInTheDocument();
  });
});
