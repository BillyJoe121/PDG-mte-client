import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DashboardData } from "../../services/dashboardApi";
import { CoverageSection, coverageItems } from "./DashboardCoverage";

const counts = (draft: number, active: number, closed: number) => ({
  keyResults: draft + active + closed, draftKeyResults: draft, activeKeyResults: active, closedKeyResults: closed,
});

const data = {
  departments: [
    { departmentId: 1, departmentName: "Ingeniería", activeProjects: 2, completedProjects: 1, ...counts(1, 1, 0) },
    { departmentId: 2, departmentName: "Sin KRs", activeProjects: 0, completedProjects: 0, ...counts(0, 0, 0) },
    { departmentId: 3, departmentName: "Ciencias", activeProjects: 1, completedProjects: 0, ...counts(0, 4, 1) },
  ],
  strategicBets: [{ strategicBetId: 7, strategicBetName: "Apuesta A", completedProjects: 0, inProgressProjects: 1, ...counts(0, 0, 0) }],
  goals: [{ goalId: 9, goalName: "Meta A", completedProjects: 0, inProgressProjects: 0, ...counts(2, 0, 0) }],
} as unknown as DashboardData;

describe("coverage table", () => {
  it("orders departments by key results and leaves out those without any", () => {
    expect(coverageItems(data, "department").map((item) => item.name)).toEqual(["Ciencias", "Ingeniería"]);
    expect(coverageItems(data, "strategicBet").map((item) => item.name)).toEqual(["Apuesta A"]);
  });

  it("opens the key results of a status from its count and switches scope with the tabs", async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();
    render(<CoverageSection data={data} onStatusClick={onStatusClick} />);

    await user.click(screen.getByRole("button", { name: "Ver 4 KRs activos de Ciencias" }));
    expect(onStatusClick).toHaveBeenCalledWith("department", expect.objectContaining({ name: "Ciencias" }), "ACTIVO");

    await user.click(screen.getByRole("tab", { name: "Metas" }));
    await user.click(screen.getByRole("button", { name: "Ver 2 KRs en borrador de Meta A" }));
    expect(onStatusClick).toHaveBeenLastCalledWith("goal", expect.objectContaining({ name: "Meta A" }), "BORRADOR");
    expect(screen.queryByRole("columnheader", { name: "Iniciativas" })).not.toBeInTheDocument();
  });
});
