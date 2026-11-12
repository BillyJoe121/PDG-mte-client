import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import { chooseOption, installRadixSelectPolyfills } from "../../../test/radixSelect";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return { ...actual, projectsApi: { ...actual.projectsApi, create: mocks.create } };
});

import { CreateProjectModal } from "./CreateProjectModal";

const departments = [{ id: 1, name: "Sistemas" }, { id: 2, name: "Industrial" }] as never;
const periods = [{ id: 1, name: "2026-1" }, { id: 2, name: "2026-2" }] as never;
const keyResults = [
  { id: 11, name: "Cobertura", description: "", metric: "Porcentaje", goals: [{ id: 1, name: "Meta A" }], strategicBets: [], academicPeriodName: "2026-1" },
  { id: 12, name: "", description: "Retención de estudiantes", metric: "Tasa", goals: [], strategicBets: [] },
] as unknown as KeyResult[];

function setup(overrides: { departments?: never; periods?: never; keyResults?: KeyResult[] } = {}) {
  const onClose = vi.fn();
  const onCreated = vi.fn().mockResolvedValue(undefined);
  render(
    <CreateProjectModal
      departments={overrides.departments ?? departments}
      periods={overrides.periods ?? periods}
      keyResults={overrides.keyResults ?? keyResults}
      onClose={onClose}
      onCreated={onCreated}
    />,
  );
  return { onClose, onCreated, user: userEvent.setup() };
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Nombre/), "  Laboratorio abierto ");
  await user.type(screen.getByLabelText(/^Descripción/), "Espacio de prototipado");
  await user.type(screen.getByLabelText(/^Tutores/), "Ana Ruiz, , Luis Pérez");
}

vi.setConfig({ testTimeout: 30000 });

describe("CreateProjectModal", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ id: 77 });
  });

  it("reports every missing required field", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Crear Iniciativa" }));

    expect(await screen.findByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripcion es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa al menos un tutor.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona al menos un Key Result.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("asks for catalogs when none exist", async () => {
    const { user } = setup({ departments: [] as never, periods: [] as never });
    await user.click(screen.getByRole("button", { name: "Crear Iniciativa" }));

    expect(await screen.findByText("Selecciona un departamento.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona el periodo de inicio.")).toBeInTheDocument();
  });

  it("explains that there are no key results to link", () => {
    setup({ keyResults: [] });

    expect(screen.getByText("No hay Key Results disponibles.")).toBeInTheDocument();
  });

  it("lists the key results with their strategy and period", () => {
    setup();

    expect(screen.getByText("KR 11 · Meta A · 2026-1")).toBeInTheDocument();
    expect(screen.getByText("KR 12 · Sin Meta ni Apuesta")).toBeInTheDocument();
    expect(screen.getByText("Retención de estudiantes")).toBeInTheDocument();
  });

  it("creates the initiative with trimmed data and the selected link", async () => {
    const { onCreated, user } = setup();
    await fillRequired(user);
    await chooseOption(user, "Tipo", "Investigacion");
    await chooseOption(user, "Departamento", "Industrial");
    await chooseOption(user, "Estado inicial", "Activo");
    await chooseOption(user, "Periodo fin", "2026-2");
    fireEvent.change(screen.getByLabelText("Fecha inicio"), { target: { value: "2026-02-01" } });
    fireEvent.change(screen.getByLabelText("Fecha fin"), { target: { value: "2026-06-01" } });
    await user.type(screen.getByLabelText("Enlace de Planner"), "https://tasks.office.com/plan/7");

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 11" }));
    expect(screen.getByText("1 seleccionado(s)")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Peso de contribución KR 11"), { target: { value: "250" } });
    expect(screen.getByLabelText("Peso de contribución KR 11")).toHaveValue(100);
    fireEvent.change(screen.getByLabelText("Peso de contribución KR 11"), { target: { value: "-5" } });
    expect(screen.getByLabelText("Peso de contribución KR 11")).toHaveValue(0);
    fireEvent.change(screen.getByLabelText("Peso de contribución KR 11"), { target: { value: "55" } });
    await chooseOption(user, "Tipo de contribución KR 11", "Soporte");

    await user.click(screen.getByRole("button", { name: "Crear Iniciativa" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      name: "Laboratorio abierto",
      description: "Espacio de prototipado",
      type: "INVESTIGACION",
      departmentId: 2,
      status: "ACTIVO",
      startPeriod: "2026-1",
      endPeriod: "2026-2",
      startDate: "2026-02-01",
      endDate: "2026-06-01",
      tutors: ["Ana Ruiz", "Luis Pérez"],
      keyResultLinks: [{ keyResultId: 11, contributionWeight: 55, contributionType: "SOPORTE" }],
    }));
    expect(toast.success).toHaveBeenCalledWith("Iniciativa creada correctamente.");
    expect(onCreated).toHaveBeenCalledWith(77);
  });

  it("sends no end period or dates when they stay undefined", async () => {
    const { user } = setup();
    await fillRequired(user);
    await chooseOption(user, "Periodo fin", "Sin definir");
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 12" }));
    await user.click(screen.getByRole("button", { name: "Crear Iniciativa" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ endPeriod: null, startDate: null, endDate: null, plannerUrl: null });
  });

  it("removes a key result from the selection", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("button", { name: "Quitar KR 11" }));

    expect(screen.getByText("0 seleccionado(s)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Peso de contribución KR 11")).not.toBeInTheDocument();
  });

  it("rejects an end period earlier than the start period", async () => {
    const { user } = setup();
    await fillRequired(user);
    await chooseOption(user, "Periodo inicio", "2026-2");
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("button", { name: "Crear Iniciativa" }));

    expect(await screen.findByText("El periodo final debe ser igual o posterior al periodo inicial.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid Planner link and clears the message when the field changes", async () => {
    const { user } = setup();
    await fillRequired(user);
    await user.type(screen.getByLabelText("Enlace de Planner"), "no es un enlace");
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("button", { name: "Crear Iniciativa" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Enlace de Planner"), "x");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("shows the error and stays open when the creation fails", async () => {
    mocks.create.mockRejectedValue(new Error("Nombre repetido"));
    const { onCreated, user } = setup();
    await fillRequired(user);
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("button", { name: "Crear Iniciativa" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Crear Iniciativa" })).toBeEnabled();
  });

  it("closes from Cancelar", async () => {
    const { onClose, user } = setup();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
  });
});
