import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FiltersProvider } from "../context/FiltersContext";
import type { UsuarioActual } from "../context/AuthContext";
import type { ProjectResponse } from "../services/projectsApi";
import { signalStrategicDataChanged } from "../utils/strategicDataRefresh";
import { chooseOption, installRadixSelectPolyfills } from "../../test/radixSelect";

const motionState = vi.hoisted(() => ({ reduce: false }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => motionState.reduce };
});

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  rol: "admin" as string,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { rol: mocks.rol } as UsuarioActual }),
}));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...actual, loadProjectsScreen: mocks.load };
});
vi.mock("./proyectos/ProjectDetailModal", () => ({
  ProjectDetailModal: ({ projectId, onClose, onOpenInHierarchy }: { projectId: number; onClose: () => void; onOpenInHierarchy: (focus: unknown) => void }) => (
    <div role="dialog" aria-label="Detalle simulado">
      <span>Detalle {projectId}</span>
      <button type="button" onClick={onClose}>Cerrar simulado</button>
      <button type="button" onClick={() => onOpenInHierarchy({ rootType: "GOAL", rootId: 3, field: "initiative", text: "Plan" })}>Ir a jerarquia</button>
    </div>
  ),
}));
vi.mock("./proyectos/CreateProjectModal", () => ({
  CreateProjectModal: ({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => Promise<void> }) => (
    <div role="dialog" aria-label="Crear simulado">
      <button type="button" onClick={onClose}>Cerrar creacion</button>
      <button type="button" onClick={() => void onCreated(42)}>Confirmar creacion</button>
    </div>
  ),
}));
vi.mock("./proyectos/KeyResultLinkModal", () => ({
  KeyResultLinkModal: ({ project, onClose, onChanged }: { project: ProjectResponse; onClose: () => void; onChanged: () => Promise<void> }) => (
    <div role="dialog" aria-label="Vinculo simulado">
      <span>Vinculo de {project.name}</span>
      <button type="button" onClick={onClose}>Cerrar vinculo</button>
      <button type="button" onClick={() => void onChanged()}>Aplicar vinculo</button>
    </div>
  ),
}));

import { Proyectos } from "./Proyectos";

const base: ProjectResponse = {
  id: 1,
  name: "Plan de becas",
  description: "Apoyo economico",
  type: "EXTENSION",
  departmentId: 2,
  departmentName: "Ingenieria",
  status: "ACTIVO",
  startPeriod: "2026-1",
  endPeriod: null,
  startDate: null,
  endDate: null,
  actualEndDate: null,
  globalProgress: 30,
  tutors: ["Ana Ruiz"],
  linkedKeyResults: [],
  origin: "LOCAL",
  syncStatus: "LOCAL_ONLY",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  plannerUrl: null,
};
const second: ProjectResponse = {
  ...base,
  id: 2,
  name: "Laboratorio móvil",
  description: "Prototipos",
  type: "GRADO",
  tutors: ["Luis Pérez"],
  linkedKeyResults: [
    { linkId: 9, keyResultId: 5, keyResultName: "Retención estudiantil", keyResultDescription: "", active: true },
    { linkId: 10, keyResultId: 6, keyResultName: "", keyResultDescription: "", active: false },
  ],
};

function screenData(projects: ProjectResponse[] = [base, second]) {
  return {
    projects,
    departments: [{ id: 2, name: "Ingenieria" }],
    periods: [{ id: 1, name: "2026-1" }],
    keyResults: [],
  };
}

function Where() {
  const location = useLocation();
  return <output aria-label="ubicacion">{location.pathname + location.search}</output>;
}

function renderPage(entry = "/proyectos") {
  render(
    <FiltersProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Proyectos />
        <Where />
      </MemoryRouter>
    </FiltersProvider>,
  );
  return userEvent.setup();
}

describe("Proyectos", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rol = "admin";
    localStorage.clear();
    sessionStorage.clear();
    mocks.load.mockResolvedValue(screenData());
  });

  it("lists the initiatives in a table by default", async () => {
    renderPage();

    expect(await screen.findByText("PROY-01")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Laboratorio móvil" })).toBeInTheDocument();
    expect(mocks.load).toHaveBeenCalledWith({ status: undefined, type: undefined, departmentId: undefined, period: undefined }, { force: undefined });
  });

  it("switches to cards and opens an initiative from the card", async () => {
    const user = renderPage();
    await screen.findByText("PROY-01");
    await user.click(screen.getByRole("button", { name: /Tarjetas/ }));

    await waitFor(() => expect(document.querySelectorAll(".project-card")).toHaveLength(2));
    expect(localStorage.getItem("mte.viewMode.projects")).toBe("cards");

    await user.click(within(document.querySelectorAll<HTMLElement>(".project-card")[0]).getByText("Plan de becas"));
    expect(await screen.findByText("Detalle 1")).toBeInTheDocument();
    expect(screen.getByLabelText("ubicacion")).toHaveTextContent("/proyectos?projectId=1");

    await user.click(screen.getByRole("button", { name: "Cerrar simulado" }));
    await waitFor(() => expect(screen.queryByText("Detalle 1")).not.toBeInTheDocument());
    expect(screen.getByLabelText("ubicacion")).not.toHaveTextContent("projectId");
    expect(mocks.load).toHaveBeenLastCalledWith(expect.anything(), { force: true });
  });

  it("filters by text ignoring accents and by linked key result", async () => {
    const user = renderPage();
    await screen.findByText("PROY-01");
    const search = screen.getByRole("textbox", { name: "Buscar iniciativas" });

    await user.type(search, "laboratorio movil");
    expect(screen.queryByText("PROY-01")).not.toBeInTheDocument();
    expect(screen.getByText("PROY-02")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "retencion");
    expect(screen.getByText("PROY-02")).toBeInTheDocument();
    expect(screen.queryByText("PROY-01")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzz");
    expect(await screen.findByText("No se encontraron iniciativas.")).toBeInTheDocument();
  });

  it("reloads with the chosen filters and clears them", async () => {
    const user = renderPage();
    await screen.findByText("PROY-01");

    await chooseOption(user, "Filtrar por estado", "Finalizado");
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(expect.objectContaining({ status: "FINALIZADO" }), expect.anything()));
    await chooseOption(user, "Filtrar por tipo", "Extension");
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(expect.objectContaining({ type: "EXTENSION" }), expect.anything()));
    await chooseOption(user, "Filtrar por departamento", "Ingenieria");
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(expect.objectContaining({ departmentId: 2 }), expect.anything()));
    await chooseOption(user, "Filtrar por periodo", "2026-1");
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(expect.objectContaining({ period: "2026-1" }), expect.anything()));

    await user.type(screen.getByRole("textbox", { name: "Buscar iniciativas" }), "plan");
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith({ status: undefined, type: undefined, departmentId: undefined, period: undefined }, expect.anything()));
    expect(screen.getByRole("textbox", { name: "Buscar iniciativas" })).toHaveValue("");
  });

  it("starts with the saved global status and period filters", async () => {
    sessionStorage.setItem("mte-global-filters", JSON.stringify({ estadoProyecto: "SUSPENDIDO", periodo: "2026-1" }));
    renderPage();

    await waitFor(() => expect(mocks.load).toHaveBeenCalledWith(expect.objectContaining({ status: "SUSPENDIDO", period: "2026-1" }), expect.anything()));
  });

  it("ignores a saved status that is not an option", async () => {
    sessionStorage.setItem("mte-global-filters", JSON.stringify({ estadoProyecto: "otro" }));
    renderPage();

    await waitFor(() => expect(mocks.load).toHaveBeenCalledWith(expect.objectContaining({ status: undefined }), expect.anything()));
  });

  it("shows the list and the cards without animation when reduced motion is preferred", async () => {
    motionState.reduce = true;
    try {
      const user = renderPage();
      expect(await screen.findByText("PROY-01")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Tarjetas/ }));

      await waitFor(() => expect(document.querySelectorAll(".project-card")).toHaveLength(2));
    } finally {
      motionState.reduce = false;
    }
  });

  it("reloads without a loading state when the initiatives change elsewhere", async () => {
    renderPage();
    await screen.findByText("PROY-01");

    act(() => signalStrategicDataChanged({ reason: "project-status", scopes: ["projects"] }));

    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(expect.anything(), { force: true }));
    expect(screen.getByText("PROY-01")).toBeInTheDocument();
    expect(screen.queryByText("Cargando iniciativas...")).not.toBeInTheDocument();
  });

  it("keeps the table when a silent reload fails", async () => {
    renderPage();
    await screen.findByText("PROY-01");
    mocks.load.mockRejectedValueOnce(new Error("Sin red"));

    act(() => signalStrategicDataChanged({ reason: "project-status", scopes: ["projects"] }));

    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Sin red")).not.toBeInTheDocument();
    expect(screen.getByText("PROY-01")).toBeInTheDocument();
  });

  it("shows the loading error", async () => {
    mocks.load.mockRejectedValue(new Error("Servidor caido"));
    renderPage();

    expect(await screen.findByText("Servidor caido")).toBeInTheDocument();
  });

  it("opens the detail named by the address", async () => {
    renderPage("/proyectos?projectId=2");
    expect(await screen.findByText("Detalle 2")).toBeInTheDocument();
  });

  it("does not open a detail for an invalid id", async () => {
    renderPage("/proyectos?projectId=abc");
    await screen.findByText("PROY-01");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends the user to the hierarchy table from the detail", async () => {
    const user = renderPage("/proyectos?projectId=1");
    await user.click(await screen.findByRole("button", { name: "Ir a jerarquia" }));

    expect(screen.getByLabelText("ubicacion")).toHaveTextContent("/jerarquia?vista=tabla");
  });

  it("lets an admin create an initiative and opens it afterwards", async () => {
    const user = renderPage();
    await screen.findByText("PROY-01");

    await user.click(screen.getByRole("button", { name: /Nueva iniciativa/ }));
    await user.click(screen.getByRole("button", { name: "Cerrar creacion" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nueva iniciativa/ }));
    await user.click(screen.getByRole("button", { name: "Confirmar creacion" }));
    expect(await screen.findByText("Detalle 42")).toBeInTheDocument();
    expect(mocks.load).toHaveBeenLastCalledWith(expect.anything(), { force: true });
  });

  it("hides creation and linking from roles that cannot manage", async () => {
    mocks.rol = "visitor";
    renderPage();
    await screen.findByText("PROY-01");

    expect(screen.queryByRole("button", { name: /Nueva iniciativa/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Vincular KR/ })).not.toBeInTheDocument();
  });

  it("links a key result from the table and from a card", async () => {
    const user = renderPage();
    await screen.findByText("PROY-01");

    await user.click(screen.getByRole("button", { name: "Vincular KR a Plan de becas" }));
    expect(screen.getByText("Vinculo de Plan de becas")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aplicar vinculo" }));
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(expect.anything(), { force: true }));
    await user.click(screen.getByRole("button", { name: "Cerrar vinculo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tarjetas/ }));
    await waitFor(() => expect(document.querySelectorAll(".project-card")).toHaveLength(2));
    const card = document.querySelectorAll<HTMLElement>(".project-card")[1];
    await user.click(within(card).getByTitle("Vincular KR"));
    expect(screen.getByText("Vinculo de Laboratorio móvil")).toBeInTheDocument();
  });
});
