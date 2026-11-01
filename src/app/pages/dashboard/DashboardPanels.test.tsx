import { render, screen } from "@testing-library/react";
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
  it("builds KPIs from the recorded status counts only", () => {
    const kpis = buildKpis(summary, 7);
    expect(kpis.map((kpi) => [kpi.label, kpi.value])).toEqual([
      ["Iniciativas activas", 4],
      ["KRs en seguimiento", 9],
      ["KRs activos", 5],
      ["KRs cerrados", 2],
    ]);
    expect(kpis[1].sub).toBe("2 en borrador, 5 activos, 2 cerrados");
    expect(kpis.some((kpi) => /promedio|cobertura|riesgo/i.test(`${kpi.label} ${kpi.sub}`))).toBe(false);
  });

  it("renders the three statuses in a fixed order and shows a missing status as zero", () => {
    const { container } = render(
      <KeyResultsByStatus data={[{ status: "CERRADO", count: 3 }, { status: "BORRADOR", count: 1 }]} />,
    );
    const rows = Array.from(container.querySelectorAll(".rounded-md")).map((row) => row.textContent);
    expect(rows).toEqual(["Borrador1", "Activos0", "Cerrados3"]);
  });

  it("shows an empty state when there are no key results", () => {
    render(<KeyResultsByStatus data={[]} />);
    expect(screen.getByText("Sin Key Results para el periodo seleccionado.")).toBeInTheDocument();
  });
});
