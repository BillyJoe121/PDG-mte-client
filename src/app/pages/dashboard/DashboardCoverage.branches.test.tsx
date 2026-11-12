import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DashboardData } from "../../services/dashboardApi";
import { CoverageSection, coverageItems, DashboardEmptyState } from "./DashboardCoverage";

const counts = (draft: number, active: number, closed: number) => ({
  keyResults: draft + active + closed, draftKeyResults: draft, activeKeyResults: active, closedKeyResults: closed,
});

const data = {
  departments: [
    { departmentId: 1, departmentName: "Beta", activeProjects: 1, completedProjects: 1, ...counts(1, 1, 1) },
    { departmentId: 2, departmentName: "Alfa", activeProjects: 0, completedProjects: 0, ...counts(1, 1, 1) },
  ],
  strategicBets: [
    { strategicBetId: 7, strategicBetName: "Apuesta sin conteos", ...counts(0, 0, 0) },
  ],
  goals: [],
} as unknown as DashboardData;

const emptyData = { departments: [], strategicBets: [], goals: [] } as unknown as DashboardData;

describe("coverage table branches", () => {
  it("breaks ties between departments by name", () => {
    expect(coverageItems(data, "department").map((item) => item.name)).toEqual(["Alfa", "Beta"]);
  });

  it("opens each status from the bar segments and the counts", async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();
    render(<CoverageSection data={data} onStatusClick={onStatusClick} />);

    const segment = screen.getAllByTitle("Cerrados: 1")[0];
    await user.click(segment);
    expect(onStatusClick).toHaveBeenCalledWith("department", expect.objectContaining({ name: "Alfa" }), "CERRADO");

    await user.click(screen.getByRole("button", { name: "Ver 1 KRs cerrados de Beta" }));
    expect(onStatusClick).toHaveBeenLastCalledWith("department", expect.objectContaining({ name: "Beta" }), "CERRADO");
  });

  it("shows zero counts and an empty bar for a bet without key results and defaults missing project counts", async () => {
    const user = userEvent.setup();
    render(<CoverageSection data={data} onStatusClick={vi.fn()} />);
    await user.click(screen.getByRole("tab", { name: "Apuestas" }));

    expect(screen.getByText("Apuesta sin conteos")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Ver \d+ KRs/ })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Iniciativas" })).toBeInTheDocument();
    expect(screen.getByText(/en curso/).textContent).toContain("en curso");
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("shows the empty message of every tab when there is nothing to list", async () => {
    const user = userEvent.setup();
    render(<CoverageSection data={emptyData} onStatusClick={vi.fn()} />);
    expect(screen.getByText("Sin KRs por departamento para el periodo.")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Apuestas" }));
    expect(screen.getByText("Sin apuestas estratégicas para el periodo.")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Metas" }));
    expect(screen.getByText("Sin metas con KRs para el periodo.")).toBeInTheDocument();
  });

  it("renders the empty state in its regular and compact heights", () => {
    const { rerender } = render(<DashboardEmptyState text="Vacío" />);
    expect(screen.getByText("Vacío")).toHaveStyle({ minHeight: "260px" });
    rerender(<DashboardEmptyState text="Vacío" compact />);
    expect(screen.getByText("Vacío")).toHaveStyle({ minHeight: "120px" });
  });
});
