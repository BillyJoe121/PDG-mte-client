import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadReportsScreen: vi.fn(),
  loadReportComparison: vi.fn(),
}));

vi.mock("../services/screenDataCache", () => ({
  loadReportsScreen: mocks.loadReportsScreen,
  loadReportComparison: mocks.loadReportComparison,
}));

vi.mock("../context/FiltersContext", () => ({
  useGlobalFilters: () => ({ filters: { periodo: "todos" }, setFilter: vi.fn() }),
}));

vi.mock("../context/AuditContext", () => ({
  useAudit: () => ({ logAudit: vi.fn() }),
}));

import { Reportes } from "./Reportes";

const emptyGeneral = {
  period: "2026-1",
  departmentId: null,
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  totalKeyResults: 0,
  activeKeyResults: 0,
  closedKeyResults: 0,
};

const periods = [{ id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" }];

describe("Reportes", () => {
  beforeEach(() => {
    mocks.loadReportsScreen.mockReset();
    mocks.loadReportComparison.mockReset();
  });

  it("shows empty states instead of invented departments or rankings when nothing is recorded", async () => {
    mocks.loadReportsScreen.mockResolvedValue({
      periods,
      departments: [],
      report: { general: emptyGeneral, departments: [], keyResultRanking: [] },
    });
    render(<Reportes />);

    expect(await screen.findByText(/no hay kRs con avance registrado en este corte/i)).toBeInTheDocument();
    expect(screen.getByText(/no hay departamentos con registros para los filtros seleccionados/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/cobertura|promedio|en riesgo/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Avance de KRs" }));
    expect(screen.getByText(/no hay kRs con avance registrado para los filtros seleccionados/i)).toBeInTheDocument();
  });

  it("explains what to do when the API returns no consolidated report", async () => {
    mocks.loadReportsScreen.mockResolvedValue({ periods, departments: [], report: null });
    render(<Reportes />);

    expect(await screen.findByText(/no hay reporte consolidado para los filtros seleccionados/i)).toBeInTheDocument();
  });

  it("orders KRs by the progress percentage recorded by their owners", async () => {
    mocks.loadReportsScreen.mockResolvedValue({
      periods,
      departments: [],
      report: {
        general: { ...emptyGeneral, totalKeyResults: 2, activeKeyResults: 2 },
        departments: [],
        keyResultRanking: [
          { keyResultId: 1, keyResultName: "KR registrado bajo", goalNames: ["Meta A"], strategicBetNames: [], period: "2026-1", progressPercentage: "30", linkedProjects: 1 },
          { keyResultId: 2, keyResultName: "KR registrado alto", goalNames: [], strategicBetNames: ["Apuesta B"], period: "2026-1", progressPercentage: "90", linkedProjects: 0 },
        ],
      },
    });
    render(<Reportes />);

    await screen.findAllByText("KR registrado alto");
    fireEvent.click(screen.getByRole("button", { name: "Avance de KRs" }));

    const names = screen.getAllByText(/KR registrado (alto|bajo)/).map((el) => el.textContent);
    expect(names).toEqual(["KR registrado alto", "KR registrado bajo"]);
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });
});
