import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectResponse } from "../../services/projectsApi";
import { ProjectTable } from "./ProjectTable";

function project(overrides: Partial<ProjectResponse> = {}): ProjectResponse {
  return {
    id: 7,
    name: "Plan de becas",
    description: "Descripción",
    type: "EXTENSION",
    departmentName: "Ingeniería",
    status: "ACTIVO",
    startPeriod: "2026-1",
    globalProgress: 40.4,
    linkedKeyResults: [{ linkId: 1 }, { linkId: 2 }],
    plannerUrl: null,
    ...overrides,
  } as ProjectResponse;
}

const handlers = () => ({ onOpen: vi.fn(), onLink: vi.fn() });

describe("ProjectTable", () => {
  it("shows the recorded data of the initiative", () => {
    render(<ProjectTable projects={[project()]} canManage={false} {...handlers()} />);

    expect(screen.getByText("PROY-07")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Extension")).toBeInTheDocument();
    expect(screen.getByText("Ingeniería")).toBeInTheDocument();
    expect(screen.getByText("2026-1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("marks an initiative without a department", () => {
    render(<ProjectTable projects={[project({ departmentName: null })]} canManage={false} {...handlers()} />);

    expect(screen.getByText("Sin departamento")).toBeInTheDocument();
  });

  it("opens the detail from the name and from the row action", () => {
    const actions = handlers();
    const item = project();
    render(<ProjectTable projects={[item]} canManage={false} {...actions} />);

    fireEvent.click(screen.getByRole("button", { name: "Plan de becas" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Plan de becas" }));

    expect(actions.onOpen).toHaveBeenCalledTimes(2);
    expect(actions.onOpen).toHaveBeenCalledWith(item);
  });

  it("offers the key result link only to who can manage", () => {
    const actions = handlers();
    const item = project();
    const { rerender } = render(<ProjectTable projects={[item]} canManage {...actions} />);

    fireEvent.click(screen.getByRole("button", { name: "Vincular KR a Plan de becas" }));
    expect(actions.onLink).toHaveBeenCalledWith(item);

    rerender(<ProjectTable projects={[item]} canManage={false} {...actions} />);
    expect(screen.queryByRole("button", { name: /^Vincular KR/ })).not.toBeInTheDocument();
  });
});
