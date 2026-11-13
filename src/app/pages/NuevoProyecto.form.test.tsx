import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  usuario: { id: "U1", rol: "manager" } as { id: string; rol: string } | null,
  navigate: vi.fn(),
  departments: vi.fn(),
  keyResults: vi.fn(),
  periods: vi.fn(),
  create: vi.fn(),
}));

vi.mock("react-router", async (importOriginal) => ({ ...(await importOriginal<typeof import("react-router")>()), useNavigate: () => mocks.navigate }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: mocks.usuario }) }));
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return {
    ...original,
    departmentsApi: { ...original.departmentsApi, list: mocks.departments },
    keyResultsApi: { ...original.keyResultsApi, list: mocks.keyResults },
  };
});
vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return { ...original, academicPeriodsApi: { ...original.academicPeriodsApi, list: mocks.periods } };
});
vi.mock("../services/projectsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/projectsApi")>();
  return { ...original, projectsApi: { ...original.projectsApi, create: mocks.create } };
});

import { NuevoProyecto } from "./NuevoProyecto";

const keyResults = [
  { id: 11, name: "KR de cobertura", description: "", metric: "Cobertura", goals: [{ id: 1, name: "Meta A" }], strategicBets: [], academicPeriodName: "2026-1" },
  { id: 12, name: "", description: "Retención de estudiantes", metric: "Tasa", goals: [], strategicBets: [] },
];

async function setup() {
  render(<MemoryRouter><NuevoProyecto /></MemoryRouter>);
  const user = userEvent.setup();
  await screen.findByText("KR de cobertura");
  return user;
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Iniciativa de analitica curricular"), "  Iniciativa de prueba ");
  await user.type(screen.getByPlaceholderText(/Describe alcance/), "Alcance de prueba");
  await user.type(screen.getByPlaceholderText("Tutora A, Tutor B"), "Ana Ruiz, , Luis Pérez");
}

const submit = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: /Crear iniciativa/ }));

describe("NuevoProyecto form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usuario = { id: "U1", rol: "manager" };
    mocks.departments.mockResolvedValue([{ id: 1, name: "Sistemas" }, { id: 2, name: "Industrial" }]);
    mocks.periods.mockResolvedValue([{ id: 1, name: "2026-1" }, { id: 2, name: "2026-2" }]);
    mocks.keyResults.mockResolvedValue(keyResults);
    mocks.create.mockResolvedValue({ id: 99 });
  });

  it("asks for a session when there is no user", async () => {
    mocks.usuario = null;
    render(<MemoryRouter><NuevoProyecto /></MemoryRouter>);

    expect(screen.getByText("Debes iniciar sesion")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Volver a iniciativas" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/proyectos");
  });

  it("shows a loading state while the catalogs arrive", async () => {
    render(<MemoryRouter><NuevoProyecto /></MemoryRouter>);

    expect(screen.getByText("Cargando catalogos...")).toBeInTheDocument();
    expect(await screen.findByText("KR de cobertura")).toBeInTheDocument();
  });

  it("lists the key results with their strategy and period", async () => {
    await setup();

    expect(screen.getByText("KR 11 - Meta A - 2026-1")).toBeInTheDocument();
    expect(screen.getByText("KR 12 - Sin Meta ni Apuesta")).toBeInTheDocument();
    expect(screen.getByText("Retención de estudiantes")).toBeInTheDocument();
  });

  it("reports every missing field", async () => {
    const user = await setup();
    await submit(user);

    expect(await screen.findByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripcion es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa al menos un tutor.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona al menos un Key Result.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText("Iniciativa de analitica curricular"), "N");
    expect(screen.queryByText("El nombre es obligatorio.")).not.toBeInTheDocument();
  });

  it("creates the initiative with the chosen options", async () => {
    const user = await setup();
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: /Macroproyecto/ }));
    const [department, status, startPeriod, endPeriod] = screen.getAllByRole("combobox");
    await user.selectOptions(department, "2");
    await user.selectOptions(status, "ACTIVO");
    await user.selectOptions(startPeriod, "2026-1");
    await user.selectOptions(endPeriod, "2026-2");
    const [startDate, endDate] = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="date"]'));
    fireEvent.change(startDate, { target: { value: "2026-02-01" } });
    fireEvent.change(endDate, { target: { value: "2026-06-01" } });
    await user.type(screen.getByLabelText("Enlace de Planner"), "  https://tasks.office.com/plan/7 ");

    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    expect(screen.getByText("1 seleccionado(s)")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await submit(user);

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create).toHaveBeenCalledWith({
      name: "Iniciativa de prueba",
      description: "Alcance de prueba",
      type: "MACROPROYECTO",
      departmentId: 2,
      status: "ACTIVO",
      startPeriod: "2026-1",
      endPeriod: "2026-2",
      startDate: "2026-02-01",
      endDate: "2026-06-01",
      tutors: ["Ana Ruiz", "Luis Pérez"],
      keyResultLinks: [{ keyResultId: 11 }],
      plannerUrl: "https://tasks.office.com/plan/7",
    });
    expect(toast.success).toHaveBeenCalledWith("Iniciativa creada correctamente.");
    expect(mocks.navigate).toHaveBeenCalledWith("/proyectos?projectId=99");
  });

  it("sends empty optional values as null", async () => {
    const user = await setup();
    await fillRequired(user);
    await user.selectOptions(screen.getAllByRole("combobox")[3], "");
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 12" }));
    await submit(user);

    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ type: "GRADO", status: "BORRADOR", endPeriod: null, startDate: null, endDate: null, plannerUrl: null });
  });

  it("deselects a key result with a second click", async () => {
    const user = await setup();
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));

    expect(screen.getByText("0 seleccionado(s)")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("rejects an end period earlier than the start period", async () => {
    const user = await setup();
    await fillRequired(user);
    await user.selectOptions(screen.getAllByRole("combobox")[2], "2026-2");
    await user.selectOptions(screen.getAllByRole("combobox")[3], "2026-1");
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    await submit(user);

    expect(await screen.findByText("El periodo final debe ser igual o posterior al periodo inicial.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid Planner link", async () => {
    const user = await setup();
    await fillRequired(user);
    await user.type(screen.getByLabelText("Enlace de Planner"), "no es un enlace");
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    await submit(user);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    [new Error("Nombre repetido"), "Nombre repetido"],
    [{ message: "Desde un objeto" }, "Desde un objeto"],
    ["texto", "No se pudo completar la accion."],
  ])("reports a failed creation (%#)", async (failure, message) => {
    mocks.create.mockRejectedValue(failure);
    const user = await setup();
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    await submit(user);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Crear iniciativa/ })).toBeEnabled();
  });

  it("explains when the catalogs cannot be loaded and keeps the form usable", async () => {
    mocks.departments.mockRejectedValue(new Error("Catalogo no disponible"));
    render(<MemoryRouter><NuevoProyecto /></MemoryRouter>);
    const user = userEvent.setup();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Catalogo no disponible"));
    expect(await screen.findByText("No hay Key Results disponibles.")).toBeInTheDocument();
    await fillRequired(user);
    await submit(user);

    expect(await screen.findByText("Selecciona un departamento.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona el periodo de inicio.")).toBeInTheDocument();
  });

  it("falls back to the default period when no period exists", async () => {
    mocks.departments.mockResolvedValue([]);
    mocks.periods.mockResolvedValue([]);
    mocks.keyResults.mockResolvedValue(keyResults);
    const user = await setup();
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    await submit(user);

    expect(await screen.findByText("Selecciona un departamento.")).toBeInTheDocument();
    expect(screen.queryByText("Selecciona el periodo de inicio.")).not.toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("goes back from the arrow and from Cancelar", async () => {
    const user = await setup();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getAllByRole("button")[0]);

    expect(mocks.navigate).toHaveBeenCalledTimes(2);
    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });
});
