import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MutableRefObject } from "react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { ComparisonExportSnapshot } from "./presentationExportItems";

const mocks = vi.hoisted(() => ({ periodComparison: vi.fn() }));

vi.mock("../../services/reportsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/reportsApi")>();
  return { ...actual, reportsApi: { ...actual.reportsApi, periodComparison: mocks.periodComparison } };
});

import { PresentationComparison } from "./PresentationComparison";

const summary = {
  summaryText: "",
  completedKeyResults: 2,
  inProgressKeyResults: 1,
  completedProjects: 1,
  inProgressProjects: 1,
  periods: [],
};

function makeBet(id: number, name: string, withSummary = true): StrategicBet {
  return { id, name, description: "", status: "ACTIVA", createdAt: "2026-01-01", ...(withSummary ? { executionSummary: summary } : {}) } as unknown as StrategicBet;
}

function makeGoal(id: number, name: string): Goal {
  return { id, name, description: "", status: "ACTIVA", createdAt: "2026-01-01", periods: [], executionSummary: summary } as unknown as Goal;
}

const bets = [makeBet(1, "Apuesta uno"), makeBet(2, "Apuesta dos")];
const goals = [makeGoal(1, "Meta uno"), makeGoal(2, "Meta dos")];
const periods = [
  { id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" },
  { id: 2, name: "2025-2", status: "CERRADO", startDate: "2025-07-01", endDate: "2025-12-31" },
] as unknown as AcademicPeriod[];

function report(total: number) {
  return { totalKeyResults: total, activeKeyResults: 1, closedKeyResults: 1, totalProjects: 2, activeProjects: 1, completedProjects: 1 };
}

type Overrides = Partial<React.ComponentProps<typeof PresentationComparison>>;

function ui(overrides: Overrides = {}) {
  return (
    <PresentationComparison
      bets={bets}
      goals={goals}
      periodName="2026-1"
      periods={periods}
      onSelectBet={vi.fn()}
      onSelectGoal={vi.fn()}
      {...overrides}
    />
  );
}

async function openMode(label: RegExp) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: label }));
  });
}

describe("PresentationComparison", () => {
  beforeEach(() => {
    mocks.periodComparison.mockReset();
    mocks.periodComparison.mockImplementation(({ basePeriod, comparePeriod }: { basePeriod: string; comparePeriod: string }) =>
      Promise.resolve({ basePeriod, comparePeriod, base: report(6), compare: report(4) }),
    );
  });

  it("explains which records are missing for each entity comparison", async () => {
    const { rerender } = render(ui({ bets: [] }));
    expect(screen.getByText("No hay apuestas estratégicas para comparar")).toBeInTheDocument();

    await openMode(/apuesta vs meta/i);
    expect(screen.getByText("No hay apuestas estratégicas para comparar")).toBeInTheDocument();

    rerender(ui({ goals: [] }));
    expect(screen.getByText("No hay metas institucionales para comparar")).toBeInTheDocument();
    await openMode(/meta vs meta/i);
    expect(screen.getByText("No hay metas institucionales para comparar")).toBeInTheDocument();

    await openMode(/apuesta vs apuesta/i);
    expect(screen.getByRole("table", { name: "Tabla comparativa" })).toBeInTheDocument();
  });

  it("falls back to placeholder names when no records exist on either side", () => {
    const exportRef: MutableRefObject<ComparisonExportSnapshot | null> = { current: null };
    render(ui({ bets: [], goals: [], exportRef }));
    expect(exportRef.current?.pdfSubtitle).toBe("Entidad A vs Entidad B (Periodo 2026-1)");
    expect(exportRef.current?.csv).toBeNull();
  });

  it("uses the only bet on both sides and shows records without a summary as empty", () => {
    render(ui({ bets: [makeBet(7, "Apuesta sola", false)] }));
    expect(screen.getAllByText("Apuesta sola").length).toBeGreaterThan(0);
    expect(screen.getByRole("table", { name: "Tabla comparativa" })).toBeInTheDocument();
  });

  it("shortens long names in the table headers", () => {
    const longName = "Nombre de apuesta extremadamente largo para la tabla";
    render(ui({ bets: [makeBet(1, longName), makeBet(2, "Corta")] }));
    expect(screen.getByRole("columnheader", { name: `${longName.slice(0, 19)}…` })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Corta" })).toBeInTheDocument();
  });

  it("changes selections, swaps sides and opens the detail of each side", async () => {
    const onSelectBet = vi.fn();
    const onSelectGoal = vi.fn();
    render(ui({ onSelectBet, onSelectGoal }));

    fireEvent.change(document.getElementById("select-entity-a") as HTMLSelectElement, { target: { value: "2" } });
    fireEvent.change(document.getElementById("select-entity-b") as HTMLSelectElement, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Apuesta dos" }));
    expect(onSelectBet).toHaveBeenCalledWith(bets[1]);

    fireEvent.click(screen.getByRole("button", { name: /intercambiar orden/i }));
    expect((document.getElementById("select-entity-a") as HTMLSelectElement).value).toBe("1");

    await openMode(/meta vs meta/i);
    fireEvent.change(document.getElementById("select-entity-a") as HTMLSelectElement, { target: { value: "2" } });
    fireEvent.change(document.getElementById("select-entity-b") as HTMLSelectElement, { target: { value: "2" } });
    fireEvent.click(screen.getAllByRole("button", { name: /^ver detalle de/i })[0]);
    expect(onSelectGoal).toHaveBeenCalledWith(goals[1]);
    fireEvent.click(screen.getByRole("button", { name: /intercambiar orden/i }));
    expect((document.getElementById("select-entity-a") as HTMLSelectElement).value).toBe("2");
  });

  it("shows a fixed VS marker without swap for bet-vs-goal and exports both names", async () => {
    const exportRef: MutableRefObject<ComparisonExportSnapshot | null> = { current: null };
    const { unmount } = render(ui({ exportRef }));
    await openMode(/apuesta vs meta/i);
    expect(screen.getByText("VS")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /intercambiar/i })).not.toBeInTheDocument();

    fireEvent.change(document.getElementById("select-entity-a") as HTMLSelectElement, { target: { value: "2" } });
    fireEvent.change(document.getElementById("select-entity-b") as HTMLSelectElement, { target: { value: "2" } });
    expect(exportRef.current?.csv?.nameA).toBe("Apuesta dos");
    expect(exportRef.current?.csv?.nameB).toBe("Meta dos");

    unmount();
    expect(exportRef.current).toBeNull();
  });

  it("keeps working without an export reference", async () => {
    const { unmount } = render(ui());
    await openMode(/periodo vs periodo/i);
    unmount();
  });

  it("asks for registered periods when none exist", async () => {
    render(ui({ periods: undefined }));
    await openMode(/periodo vs periodo/i);
    expect(screen.getByText("No hay periodos académicos registrados")).toBeInTheDocument();
    expect(mocks.periodComparison).not.toHaveBeenCalled();
  });

  it("selects the first periods when they arrive after the first render", async () => {
    const { rerender } = render(ui({ periods: undefined }));
    await openMode(/periodo vs periodo/i);
    rerender(ui({ periods }));
    await waitFor(() => expect(mocks.periodComparison).toHaveBeenCalledWith({ basePeriod: "2026-1", comparePeriod: "2025-2" }));
    rerender(ui({ periods: [periods[0]] }));
    expect(await screen.findByRole("table", { name: "Tabla comparativa" })).toBeInTheDocument();
  });

  it("uses the same period on both sides when only one is registered", async () => {
    const exportRef: MutableRefObject<ComparisonExportSnapshot | null> = { current: null };
    render(ui({ periods: [periods[0]], exportRef }));
    await openMode(/periodo vs periodo/i);
    await waitFor(() => expect(mocks.periodComparison).toHaveBeenCalledWith({ basePeriod: "2026-1", comparePeriod: "2026-1" }));
    expect(exportRef.current?.pdfSubtitle).toBe("Periodo 2026-1 vs 2026-1");
  });

  it("shows loading, then the table, and swaps periods", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    mocks.periodComparison.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(ui());
    await openMode(/periodo vs periodo/i);
    expect(screen.getByText("Cargando comparativa de periodos...")).toBeInTheDocument();

    await act(async () => {
      resolve({ basePeriod: "", comparePeriod: "", base: report(6), compare: report(4) });
    });
    expect(await screen.findByText("Valores registrados en el Periodo 2026-1 y en el Periodo 2025-2.")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /intercambiar periodos/i }));
    });
    expect(await screen.findByText("Valores registrados en el Periodo 2025-2 y en el Periodo 2026-1.")).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(document.getElementById("select-period-a") as HTMLSelectElement, { target: { value: "2025-2" } });
      fireEvent.change(document.getElementById("select-period-b") as HTMLSelectElement, { target: { value: "2026-1" } });
    });
    expect(mocks.periodComparison).toHaveBeenLastCalledWith({ basePeriod: "2025-2", comparePeriod: "2026-1" });
  });

  it("shows the error of a failed period comparison without a trailing dot duplicated", async () => {
    mocks.periodComparison.mockRejectedValue(new Error("Servicio caído."));
    render(ui());
    await openMode(/periodo vs periodo/i);
    expect(await screen.findByText("No se pudo cargar la comparativa de periodos")).toBeInTheDocument();
    expect(screen.getByText("Servicio caído. Intenta de nuevo o selecciona otros periodos.")).toBeInTheDocument();
  });

  it("shows the empty state when the report has no data for the periods", async () => {
    mocks.periodComparison.mockResolvedValue({ basePeriod: "2026-1", comparePeriod: "2025-2", base: null, compare: null });
    render(ui());
    await openMode(/periodo vs periodo/i);
    expect(await screen.findByText("No hay datos para los periodos seleccionados")).toBeInTheDocument();
  });

  it("ignores a response that arrives after leaving the period mode", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    let reject: (reason: unknown) => void = () => undefined;
    mocks.periodComparison
      .mockReturnValueOnce(new Promise((r) => { resolve = r; }))
      .mockReturnValueOnce(new Promise((_, r) => { reject = r; }));
    render(ui());
    await openMode(/periodo vs periodo/i);
    await openMode(/apuesta vs apuesta/i);
    await act(async () => {
      resolve({ base: report(1), compare: report(1) });
    });
    await openMode(/periodo vs periodo/i);
    await openMode(/meta vs meta/i);
    await act(async () => {
      reject(new Error("tarde"));
    });
    expect(screen.queryByText("No se pudo cargar la comparativa de periodos")).not.toBeInTheDocument();
  });
});
