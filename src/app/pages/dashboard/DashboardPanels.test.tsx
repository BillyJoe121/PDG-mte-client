import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DashboardSummary } from "../../services/dashboardApi";
import { buildKpis, KeyResultsByStatus } from "./DashboardPanels";

const summary: DashboardSummary = {
  period: "2026-2",
  activeProjects: 4,
  completedProjects: 2,
  draftProjects: 1,
  suspendedProjects: 0,
  archivedProjects: 0,
  keyResultsInFollowUp: 9,
  draftKeyResults: 2,
  activeKeyResults: 5,
  closedKeyResults: 2,
};

describe("dashboard key result counts", () => {
  it("builds the headline counters from the recorded status counts only", () => {
    const kpis = buildKpis(summary, 7);
    expect(kpis.map((kpi) => [kpi.label, kpi.value])).toEqual([
      ["Iniciativas", 7],
      ["Iniciativas activas", 4],
      ["Iniciativas finalizadas", 2],
      ["KRs en seguimiento", 9],
      ["KRs activos", 5],
      ["KRs cerrados", 2],
    ]);
    expect(kpis.some((kpi) => /promedio|cobertura|riesgo/i.test(kpi.label))).toBe(false);
  });

  it("lists the three statuses in a fixed order with their share and shows a missing status as zero", () => {
    render(<KeyResultsByStatus data={[{ status: "CERRADO", count: 3 }, { status: "BORRADOR", count: 1 }]} />);
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["Borrador125%", "Activos00%", "Cerrados375%"]);
    expect(within(items[2]).getByText("75%")).toBeInTheDocument();
  });

  it("shows an empty state when there are no key results", () => {
    render(<KeyResultsByStatus data={[]} />);
    expect(screen.getByText("Sin Key Results para el periodo seleccionado.")).toBeInTheDocument();
  });
});
