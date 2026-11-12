import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ProjectResponse, ProjectStatus } from "../../services/projectsApi";
import { chooseOption, installRadixSelectPolyfills } from "../../../test/radixSelect";
const motionState = vi.hoisted(() => ({ reduce: false }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => motionState.reduce };
});

import { ProjectCardView, projectTypeLabel } from "./ProjectCardView";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectStats, buildProjectStats } from "./ProjectStats";
import { errorMessage, statusLabel, typeLabel } from "./proyectosShared";

function project(overrides: Partial<ProjectResponse> = {}): ProjectResponse {
  return {
    id: 3,
    name: "Plan de becas",
    description: "Apoyo economico",
    type: "EXTENSION",
    departmentName: "Ingenieria",
    status: "ACTIVO",
    startPeriod: "2026-1",
    globalProgress: 40.4,
    tutors: [],
    linkedKeyResults: [],
    plannerUrl: null,
    ...overrides,
  } as ProjectResponse;
}

describe("ProjectCardView", () => {
  it("shows the recorded data of the initiative", () => {
    render(<ProjectCardView canManage={false} project={project()} onLink={vi.fn()} onOpen={vi.fn()} />);

    expect(screen.getByText("PROY-03")).toBeInTheDocument();
    expect(screen.getByText("2026-1 - Ingenieria")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Plan de becas")).toBeInTheDocument();
    expect(screen.getByText("Extension")).toBeInTheDocument();
    expect(projectTypeLabel(project())).toBe("Extension");
  });

  it("marks an initiative without a department and truncates a long name", () => {
    const longName = "N".repeat(80);
    render(<ProjectCardView canManage={false} project={project({ departmentName: null, name: longName })} onLink={vi.fn()} onOpen={vi.fn()} />);

    expect(screen.getByText("2026-1 - Sin departamento")).toBeInTheDocument();
    expect(screen.queryByText(longName)).not.toBeInTheDocument();
  });

  it.each<[ProjectStatus, string]>([
    ["BORRADOR", "Borrador"],
    ["FINALIZADO", "Finalizado"],
    ["SUSPENDIDO", "Suspendido"],
    ["ARCHIVADO", "Archivado"],
  ])("labels the %s status", (status, label) => {
    render(<ProjectCardView canManage={false} project={project({ status })} onLink={vi.fn()} onOpen={vi.fn()} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("opens with click, Enter and Space but ignores other keys", () => {
    const onOpen = vi.fn();
    render(<ProjectCardView canManage={false} project={project()} onLink={vi.fn()} onOpen={onOpen} />);
    const card = screen.getByRole("button");

    fireEvent.click(card);
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });
    fireEvent.keyDown(card, { key: "a" });

    expect(onOpen).toHaveBeenCalledTimes(3);
  });

  it("links a key result without opening the card, only for who can manage", async () => {
    const onLink = vi.fn();
    const onOpen = vi.fn();
    const { rerender } = render(<ProjectCardView canManage project={project()} onLink={onLink} onOpen={onOpen} />);

    await userEvent.setup().click(screen.getByTitle("Vincular KR"));
    expect(onLink).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();

    rerender(<ProjectCardView canManage={false} project={project()} onLink={onLink} onOpen={onOpen} />);
    expect(screen.queryByTitle("Vincular KR")).not.toBeInTheDocument();
  });

  it("offers the Planner link and tags only the first card for the tour", () => {
    const { rerender } = render(<ProjectCardView canManage={false} project={project({ plannerUrl: "https://tasks.office.com/plan/7" })} onLink={vi.fn()} onOpen={vi.fn()} />);

    expect(screen.getByText("Ir a Planner")).toBeInTheDocument();
    expect(document.querySelector('[data-tour="proyectos-item"]')).not.toBeNull();

    rerender(<ProjectCardView canManage={false} index={2} project={project()} onLink={vi.fn()} onOpen={vi.fn()} />);
    expect(document.querySelector('[data-tour="proyectos-item"]')).toBeNull();
  });
});

describe("reduced motion preference", () => {
  beforeAll(() => {
    motionState.reduce = true;
    return () => {
      motionState.reduce = false;
    };
  });

  it("renders the cards and the indicators without entrance animation", () => {
    render(
      <>
        <ProjectCardView canManage={false} project={project()} onLink={vi.fn()} onOpen={vi.fn()} />
        <ProjectStats stats={{ activos: 1, finalizados: 2, krs: 3, total: 4 }} />
      </>,
    );

    expect(screen.getByText("Plan de becas")).toBeInTheDocument();
    expect(screen.getByText("KRs vinculados")).toBeInTheDocument();
    expect(document.querySelector(".project-card")).not.toBeNull();
  });
});

describe("ProjectFilters", () => {
  beforeAll(installRadixSelectPolyfills);

  function renderFilters(overrides: Partial<Parameters<typeof ProjectFilters>[0]> = {}) {
    const handlers = {
      onDepartmentChange: vi.fn(),
      onPeriodChange: vi.fn(),
      onReset: vi.fn(),
      onSearchChange: vi.fn(),
      onStatusChange: vi.fn(),
      onTypeChange: vi.fn(),
      onViewModeChange: vi.fn(),
    };
    render(
      <ProjectFilters
        departmentId="todos"
        departments={[{ id: 4, name: "Sistemas" } as never]}
        period="todos"
        periods={[{ id: 1, name: "2026-1" } as never]}
        search=""
        status="todos"
        type="todos"
        viewMode="table"
        {...handlers}
        {...overrides}
      />,
    );
    return { handlers, user: userEvent.setup() };
  }

  it("reports every filter the user changes", async () => {
    const { handlers, user } = renderFilters();

    await user.type(screen.getByRole("textbox", { name: "Buscar iniciativas" }), "a");
    await chooseOption(user, "Filtrar por estado", "Activo");
    await chooseOption(user, "Filtrar por tipo", "Macroproyecto");
    await chooseOption(user, "Filtrar por departamento", "Sistemas");
    await chooseOption(user, "Filtrar por periodo", "2026-1");
    await user.click(screen.getByRole("button", { name: /Tarjetas/ }));
    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(handlers.onSearchChange).toHaveBeenCalledWith("a");
    expect(handlers.onStatusChange).toHaveBeenCalledWith("ACTIVO");
    expect(handlers.onTypeChange).toHaveBeenCalledWith("MACROPROYECTO");
    expect(handlers.onDepartmentChange).toHaveBeenCalledWith("4");
    expect(handlers.onPeriodChange).toHaveBeenCalledWith("2026-1");
    expect(handlers.onViewModeChange).toHaveBeenCalledWith("cards");
    expect(handlers.onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Nueva iniciativa/ })).not.toBeInTheDocument();
  });

  it("shows the create button when creation is allowed", async () => {
    const onCreateProject = vi.fn();
    const { user } = renderFilters({ onCreateProject });

    await user.click(screen.getByRole("button", { name: /Nueva iniciativa/ }));
    expect(onCreateProject).toHaveBeenCalledTimes(1);
  });
});

describe("ProjectStats", () => {
  it("counts the filtered initiatives and their distinct key results", () => {
    const stats = buildProjectStats([
      project({ id: 1, status: "ACTIVO", linkedKeyResults: [{ keyResultId: 1 }, { keyResultId: 2 }] as never }),
      project({ id: 2, status: "FINALIZADO", linkedKeyResults: [{ keyResultId: 2 }] as never }),
      project({ id: 3, status: "BORRADOR" }),
    ]);

    expect(stats).toEqual({ activos: 1, finalizados: 1, krs: 2, total: 3 });
    render(<ProjectStats stats={stats} />);
    expect(screen.getByText("KRs vinculados")).toBeInTheDocument();
    expect(screen.getByText("Total filtrado").previousSibling).toHaveTextContent("3");
  });
});

describe("proyectosShared", () => {
  it("falls back to the raw value for unknown labels", () => {
    expect(statusLabel("ACTIVO")).toBe("Activo");
    expect(statusLabel("OTRO" as ProjectStatus)).toBe("OTRO");
    expect(typeLabel("GRADO")).toBe("Proyecto de grado");
    expect(typeLabel("OTRO" as never)).toBe("OTRO");
  });

  it("reads the message of any error shape", () => {
    expect(errorMessage(new Error("fallo"))).toBe("fallo");
    expect(errorMessage({ message: "desde objeto" })).toBe("desde objeto");
    expect(errorMessage("texto")).toBe("No se pudo completar la accion.");
    expect(errorMessage(null)).toBe("No se pudo completar la accion.");
  });
});
