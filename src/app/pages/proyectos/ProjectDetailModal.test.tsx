import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioActual } from "../../context/AuthContext";
import type { ProjectDetailResponse, ProjectResponse } from "../../services/projectsApi";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  update: vi.fn(),
  registerProgress: vi.fn(),
  listTeachers: vi.fn(),
  professors: vi.fn(),
  roles: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError, warning: vi.fn() } }));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { rol: "admin" } as UsuarioActual }),
}));
vi.mock("../../services/screenDataCache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/screenDataCache")>();
  return { ...actual, loadProjectDetailScreen: mocks.load, invalidateScreenDataCache: vi.fn() };
});
vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return {
    ...actual,
    projectsApi: { ...actual.projectsApi, update: mocks.update, registerProgress: mocks.registerProgress },
    projectTeachersApi: { ...actual.projectTeachersApi, list: mocks.listTeachers },
    projectResponsibilityCatalogApi: { ...actual.projectResponsibilityCatalogApi, professors: mocks.professors, roles: mocks.roles },
  };
});

import { ProjectDetailModal } from "./ProjectDetailModal";
import type { HierarchyTableFocus } from "../jerarquia/hierarchyTableLink";

const project: ProjectResponse = {
  id: 7,
  name: "Laboratorio abierto",
  description: "Espacio de prototipado",
  type: "INVESTIGACION",
  departmentId: 2,
  departmentName: "Ingenieria",
  status: "ACTIVO",
  startPeriod: "2026-1",
  endPeriod: null,
  startDate: "2026-02-01",
  endDate: null,
  actualEndDate: null,
  globalProgress: 40,
  tutors: ["Ana Ruiz"],
  linkedKeyResults: [],
  origin: "LOCAL",
  syncStatus: "LOCAL_ONLY",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  plannerUrl: null,
};

const detail: ProjectDetailResponse = {
  project,
  kpis: { progressEntries: 0, linkedKeyResults: 0, completed: false },
  history: [],
  linkedKeyResults: [],
  contributionChain: { projectId: 7, projectName: project.name, globalProgress: 40, status: "ACTIVO", impacts: [] },
};

function renderDetail(onClose = vi.fn(), onOpenInHierarchy?: (focus: HierarchyTableFocus) => void) {
  render(<ProjectDetailModal projectId={7} onClose={onClose} onOpenInHierarchy={onOpenInHierarchy} />);
  return { onClose, user: userEvent.setup() };
}

describe("ProjectDetailModal edit mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockResolvedValue({
      detail,
      contributionChain: detail.contributionChain,
      keyResults: [],
      departments: [{ id: 2, name: "Ingenieria" }],
      periods: [{ id: 1, name: "2026-1" }],
    });
    mocks.update.mockResolvedValue(project);
    mocks.registerProgress.mockResolvedValue({});
    mocks.listTeachers.mockResolvedValue([]);
    mocks.professors.mockResolvedValue([]);
    mocks.roles.mockResolvedValue([]);
  });

  it.each([
    ["Editar iniciativa", "Nombre"],
    ["Registrar avance", "Comentario"],
    ["Responsables", "Desde"],
  ])("opens %s inside the same dialog", async (button, field) => {
    const { user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: button }));

    expect(await screen.findByLabelText(field)).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText(/Iniciativa PROY-07/)).toBeInTheDocument();
  });

  it("opens the key result link form from the actions bar inside the same dialog", async () => {
    const { user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: "Vincular KR" }));

    expect(await screen.findByRole("combobox", { name: "Key Result" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Peso de contribución")).not.toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("keeps the ten initiative fields in edit mode", async () => {
    const { user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: "Editar iniciativa" }));

    for (const field of ["Nombre", "Descripción", "Fecha inicio", "Fecha fin", "Fecha fin real", /^Tutores/]) {
      expect(await screen.findByLabelText(field)).toBeInTheDocument();
    }
    for (const field of ["Tipo", "Departamento", "Periodo inicial", "Periodo final"]) {
      expect(screen.getByRole("combobox", { name: field })).toBeInTheDocument();
    }
  });

  it("saves from the top bar and returns to the reloaded detail", async () => {
    const { user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: "Editar iniciativa" }));
    await user.type(await screen.findByLabelText("Nombre"), " 2");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(7, expect.objectContaining({ name: "Laboratorio abierto 2" })));
    expect(await screen.findByRole("button", { name: "Editar iniciativa" })).toBeInTheDocument();
    expect(mocks.load).toHaveBeenLastCalledWith(7, { force: true });
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
  });

  it("stays in edit mode when saving fails", async () => {
    mocks.update.mockRejectedValue(new Error("fallo"));
    const { user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: "Editar iniciativa" }));
    await user.type(await screen.findByLabelText("Nombre"), " 2");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(screen.getByLabelText("Nombre")).toHaveValue("Laboratorio abierto 2");
  });

  it("requires a comment before recording progress", async () => {
    const { user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: "Registrar avance" }));
    await user.click(await screen.findByRole("button", { name: "Guardar avance" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El comentario es obligatorio.");
    expect(mocks.registerProgress).not.toHaveBeenCalled();
  });

  it("leaves a clean panel without asking", async () => {
    const { onClose, user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: "Editar iniciativa" }));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("button", { name: "Editar iniciativa" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("asks before discarding changes when cancelling or closing", async () => {
    const { onClose, user } = renderDetail();
    await user.click(await screen.findByRole("button", { name: "Registrar avance" }));
    await user.type(await screen.findByLabelText("Comentario"), "Primer avance");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    const warning = await screen.findByRole("dialog", { name: "Descartar cambios" });
    await user.click(within(warning).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByLabelText("Comentario")).toHaveValue("Primer avance");

    await user.click(screen.getByRole("button", { name: "Cerrar detalle de iniciativa" }));
    const closing = await screen.findByRole("dialog", { name: "Descartar cambios" });
    expect(onClose).not.toHaveBeenCalled();
    await user.click(within(closing).getByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

describe("ProjectDetailModal links", () => {
  const linkedKr = {
    id: 11,
    name: "Elevar permanencia",
    goals: [{ id: 3, name: "Graduación oportuna" }],
    strategicBets: [],
  };
  const linkedDetail: ProjectDetailResponse = {
    ...detail,
    project: { ...project, plannerUrl: "https://tasks.office.com/plan/7" },
    kpis: { ...detail.kpis, linkedKeyResults: 1 },
    linkedKeyResults: [
      { id: 1, projectId: 7, keyResultId: 11, keyResultDescription: "Permanencia", active: true },
      { id: 2, projectId: 7, keyResultId: 12, keyResultDescription: "Inactivo", active: false },
    ] as ProjectDetailResponse["linkedKeyResults"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockResolvedValue({ detail: linkedDetail, contributionChain: detail.contributionChain, keyResults: [linkedKr], departments: [], periods: [] });
    mocks.listTeachers.mockResolvedValue([]);
  });

  it("paints Vincular KR green with a linked KR and lists the KR names", async () => {
    const { user } = renderDetail();

    expect(await screen.findByRole("button", { name: "Vincular KR" })).toHaveClass("bg-[#4CB979]");
    await user.click(screen.getByRole("tab", { name: /Resumen/ }));
    expect(screen.getByRole("listitem")).toHaveTextContent("Elevar permanencia");
  });

  it("paints Vincular KR gray without links", async () => {
    mocks.load.mockResolvedValue({ detail, contributionChain: detail.contributionChain, keyResults: [], departments: [], periods: [] });
    renderDetail();

    expect(await screen.findByRole("button", { name: "Vincular KR" })).toHaveClass("bg-[#E5E7EB]");
  });

  it("shows the Planner link as a clickable link outside the tabs", async () => {
    renderDetail();

    const link = await screen.findByRole("link", { name: /Abrir el plan en Microsoft Planner/ });
    expect(link).toHaveAttribute("href", "https://tasks.office.com/plan/7");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("opens the hierarchy table from the linked goal and disables the missing bet", async () => {
    const onOpenInHierarchy = vi.fn();
    const { user } = renderDetail(vi.fn(), onOpenInHierarchy);

    await user.click(await screen.findByRole("button", { name: "Ver en Meta" }));
    expect(onOpenInHierarchy).toHaveBeenCalledWith({ rootType: "GOAL", rootId: 3, field: "initiative", text: "Laboratorio abierto" });
    expect(screen.getByRole("button", { name: /Ver en Apuesta/ })).toBeDisabled();
  });
});
