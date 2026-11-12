import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installRadixSelectPolyfills, chooseOption } from "../../test/radixSelect";
import type { DashboardData } from "../services/dashboardApi";
import { Dashboard } from "./Dashboard";

const mocks = vi.hoisted(() => ({
  loadDashboardScreen: vi.fn(),
  setFilter: vi.fn(),
  filters: { periodo: "todos" },
}));

vi.mock("../services/screenDataCache", () => ({ loadDashboardScreen: mocks.loadDashboardScreen }));
vi.mock("../context/FiltersContext", () => ({
  useGlobalFilters: () => ({ filters: mocks.filters, setFilter: mocks.setFilter }),
}));

const counts = (draft: number, active: number, closed: number) => ({
  keyResults: draft + active + closed, draftKeyResults: draft, activeKeyResults: active, closedKeyResults: closed,
});

const dashboard = {
  summary: {
    period: "2026-1", activeProjects: 2, completedProjects: 1, draftProjects: 0, suspendedProjects: 0, archivedProjects: 0,
    keyResultsInFollowUp: 3, draftKeyResults: 0, activeKeyResults: 3, closedKeyResults: 0,
  },
  projectsByStatus: [{ status: "ACTIVO", count: 2 }, { status: "FINALIZADO", count: 1 }],
  keyResultsByStatus: [{ status: "ACTIVO", count: 3 }],
  departments: [{ departmentId: 1, departmentName: "Ingenieria", activeProjects: 2, completedProjects: 1, ...counts(0, 3, 0) }],
  strategicBets: [],
  goals: [],
} as unknown as DashboardData;

const periods = [
  { id: 1, name: "2025-2", startDate: "2025-07-01", endDate: "2025-12-31", status: "CERRADO" },
  { id: 2, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-30", status: "ACTIVO" },
];

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}{location.search}</p>;
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installRadixSelectPolyfills();
    mocks.filters.periodo = "todos";
    mocks.loadDashboardScreen.mockResolvedValue({ periods, dashboard });
  });

  it("shows the loading state, then the counters and panels", async () => {
    let resolve!: (value: unknown) => void;
    mocks.loadDashboardScreen.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    renderDashboard();
    expect(screen.getByText("Cargando dashboard...")).toBeInTheDocument();

    await act(async () => resolve({ periods, dashboard }));
    expect(await screen.findByText("Iniciativas por estado")).toBeInTheDocument();
    expect(screen.getByText("KRs por estado")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Periodo" })).toHaveTextContent("Periodo activo (2026-1)");
    expect(mocks.loadDashboardScreen).toHaveBeenCalledWith(undefined, { force: undefined });
  });

  it("starts from the period stored in the global filters", async () => {
    mocks.filters.periodo = "2025-2";
    renderDashboard();
    await screen.findByText("Iniciativas por estado");
    expect(mocks.loadDashboardScreen).toHaveBeenCalledWith("2025-2", { force: undefined });
  });

  it("changes the period, stores it in the filters and falls back to the active one", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Iniciativas por estado");

    await chooseOption(user, "Periodo", "2025-2");
    expect(mocks.setFilter).toHaveBeenLastCalledWith("periodo", "2025-2");
    await waitFor(() => expect(mocks.loadDashboardScreen).toHaveBeenLastCalledWith("2025-2", { force: undefined }));

    await chooseOption(user, "Periodo", /Periodo activo/);
    expect(mocks.setFilter).toHaveBeenLastCalledWith("periodo", "todos");
  });

  it("reloads on demand forcing a fresh request", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText("Iniciativas por estado");

    await user.click(screen.getByRole("button", { name: "Recargar dashboard" }));
    await waitFor(() => expect(mocks.loadDashboardScreen).toHaveBeenLastCalledWith(undefined, { force: true }));
  });

  it("reports load errors from Error objects, plain objects and unknown values", async () => {
    mocks.loadDashboardScreen.mockRejectedValueOnce(new Error("Servidor caido"));
    const first = renderDashboard();
    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor caido");
    expect(screen.getByText("Sin datos para el periodo seleccionado.")).toBeInTheDocument();
    first.unmount();

    mocks.loadDashboardScreen.mockRejectedValueOnce({ message: "Respuesta invalida" });
    const second = renderDashboard();
    expect(await screen.findByRole("alert")).toHaveTextContent("Respuesta invalida");
    second.unmount();

    mocks.loadDashboardScreen.mockRejectedValueOnce(42);
    renderDashboard();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el dashboard.");
  });

  it("opens the key results of a coverage count with the selected period", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole("button", { name: "Ver 3 KRs activos de Ingenieria" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/krs?status=ACTIVO&period=2026-1&department=Ingenieria");
  });

  it("uses the chosen period in the drilldown and drops it when none is known", async () => {
    const user = userEvent.setup();
    mocks.loadDashboardScreen.mockResolvedValue({
      periods,
      dashboard: { ...dashboard, summary: { ...dashboard.summary, period: null } },
    });
    renderDashboard();
    await user.click(await screen.findByRole("button", { name: "Ver 3 KRs activos de Ingenieria" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/krs?status=ACTIVO&department=Ingenieria");
  });

  it("refreshes silently when dashboard data changes elsewhere and ignores silent failures", async () => {
    renderDashboard();
    await screen.findByText("Iniciativas por estado");
    mocks.loadDashboardScreen.mockRejectedValueOnce(new Error("offline"));

    await act(async () => { window.dispatchEvent(new Event("focus")); });
    await waitFor(() => expect(mocks.loadDashboardScreen).toHaveBeenLastCalledWith(undefined, { force: true }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Iniciativas por estado")).toBeInTheDocument();
  });

  it("falls back to a generic active period name before anything loads", async () => {
    mocks.loadDashboardScreen.mockRejectedValue(new Error("x"));
    renderDashboard();
    await screen.findByRole("alert");
    expect(screen.getByRole("combobox", { name: "Periodo" })).toHaveTextContent("Periodo activo (Periodo activo)");
  });
});
