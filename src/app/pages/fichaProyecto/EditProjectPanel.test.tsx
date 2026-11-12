import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProject } from "../../../test/projectFixtures";
import { chooseOption, installRadixSelectPolyfills } from "../../../test/radixSelect";

const mocks = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return { ...actual, projectsApi: { ...actual.projectsApi, update: mocks.update } };
});

import { EditProjectPanel } from "./EditProjectPanel";

const departments = [{ id: 2, name: "Ingenieria" }, { id: 3, name: "Ciencias" }] as never;
const periods = [{ id: 1, name: "2026-1" }, { id: 2, name: "2026-2" }] as never;

function setup(project = makeProject()) {
  const onCancel = vi.fn();
  const onDirtyChange = vi.fn();
  const onSaved = vi.fn().mockResolvedValue(undefined);
  render(<EditProjectPanel departments={departments} periods={periods} project={project} onCancel={onCancel} onDirtyChange={onDirtyChange} onSaved={onSaved} />);
  return { onCancel, onDirtyChange, onSaved, user: userEvent.setup() };
}

const save = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Guardar" }));

vi.setConfig({ testTimeout: 30000 });

describe("EditProjectPanel", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue(makeProject());
  });

  it("starts with the data of the initiative", () => {
    setup(makeProject({ endPeriod: "2026-2", startDate: "2026-02-01T00:00:00Z", plannerUrl: "https://tasks.office.com/plan/7", tutors: ["Ana", "Luis"] }));

    expect(screen.getByDisplayValue("Laboratorio abierto")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Espacio de prototipado")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ana, Luis")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-02-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://tasks.office.com/plan/7")).toBeInTheDocument();
  });

  it("saves the edited data trimmed and normalized", async () => {
    const { onSaved, onDirtyChange, user } = setup();
    await user.clear(screen.getByLabelText(/^Nombre/));
    await user.type(screen.getByLabelText(/^Nombre/), "  Nuevo nombre ");
    await user.clear(screen.getByLabelText(/^Descripción/));
    await user.type(screen.getByLabelText(/^Descripción/), "Otra descripción");
    await chooseOption(user, "Tipo", "Extensión");
    await chooseOption(user, "Departamento", "Ciencias");
    await chooseOption(user, "Periodo inicial", "2026-2");
    await chooseOption(user, "Periodo final", "2026-2");
    fireEvent.change(screen.getByLabelText(/^Fecha inicio/), { target: { value: "2026-03-01" } });
    fireEvent.change(screen.getByLabelText(/^Fecha fin$/), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByLabelText(/^Fecha fin real/), { target: { value: "2026-06-10" } });
    await user.clear(screen.getByLabelText(/^Tutores/));
    await user.type(screen.getByLabelText(/^Tutores/), "Ana, , Luis");
    await user.type(screen.getByLabelText("Enlace de Planner"), "https://tasks.office.com/plan/9");
    await save(user);

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith(7, {
      name: "Nuevo nombre",
      description: "Otra descripción",
      type: "EXTENSION",
      departmentId: 3,
      startPeriod: "2026-2",
      endPeriod: "2026-2",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
      actualEndDate: "2026-06-10",
      tutors: ["Ana", "Luis"],
      plannerUrl: "https://tasks.office.com/plan/9",
    });
    expect(toast.success).toHaveBeenCalledWith("Iniciativa actualizada.");
    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it("clears the optional end period and dates", async () => {
    const { user } = setup(makeProject({ endPeriod: "2026-2" }));
    await chooseOption(user, "Periodo final", "Sin periodo final");
    await save(user);

    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][1]).toMatchObject({ endPeriod: null, startDate: "2026-02-01", endDate: null, actualEndDate: null, plannerUrl: null });
  });

  it("saves an initiative without a start date and without date limits on the other dates", async () => {
    const { user } = setup(makeProject({ startDate: null }));
    expect(screen.getByLabelText(/^Fecha fin$/)).not.toHaveAttribute("min");
    expect(screen.getByLabelText(/^Fecha fin real/)).not.toHaveAttribute("min");
    await save(user);

    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][1]).toMatchObject({ startDate: null });
  });

  it("requires the main fields", async () => {
    const { user } = setup(makeProject({ departmentId: null }));
    await save(user);

    expect(toast.error).toHaveBeenCalledWith("Completa nombre, descripcion, departamento y periodo inicial.");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects an end period earlier than the start period", async () => {
    const { user } = setup(makeProject({ startPeriod: "2026-2", endPeriod: "2026-1" }));
    await save(user);

    expect(toast.error).toHaveBeenCalledWith("El periodo final debe ser igual o posterior al periodo inicial.");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("requires at least one tutor", async () => {
    const { user } = setup(makeProject({ tutors: [] }));
    await save(user);

    expect(toast.error).toHaveBeenCalledWith("Agrega al menos un tutor.");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid Planner link and clears the message when it is edited", async () => {
    const { user } = setup(makeProject({ plannerUrl: "http://insecure.example.com" }));
    await save(user);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Enlace de Planner"), "x");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reports a failed save and stays in edit mode", async () => {
    mocks.update.mockRejectedValue(new Error("Conflicto de edicion"));
    const { onSaved, user } = setup();
    await save(user);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Conflicto de edicion"));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("cancels the edition", async () => {
    const { onCancel, user } = setup();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
