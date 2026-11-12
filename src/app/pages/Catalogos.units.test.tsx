import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listPeriods: vi.fn(),
  listUnits: vi.fn(),
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  setActive: vi.fn(),
  removeUnit: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { id: "U1", rol: "admin" } }) }));
vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return {
    ...original,
    academicPeriodsApi: { list: api.listPeriods, create: vi.fn(), update: vi.fn(), updateStatus: vi.fn(), setActive: vi.fn(), remove: vi.fn() },
    measurementUnitsApi: { list: api.listUnits, create: api.createUnit, update: api.updateUnit, setActive: api.setActive, remove: api.removeUnit },
  };
});

import { ApiError } from "../services/catalogsApi";
import { Catalogos } from "./Catalogos";

const units = [
  { id: 2, name: "Zonas", type: "OTRA", active: false, description: null },
  { id: 1, name: "Avance", type: "PORCENTAJE", active: true, description: "Porcentaje de avance" },
];

const nameField = () => screen.getByLabelText(/^Nombre/);
const submit = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Crear" }));

async function setup() {
  const user = userEvent.setup();
  render(<Catalogos />);
  await screen.findByRole("tab", { name: /Unidades/ });
  await waitFor(() => expect(screen.queryByText(/Cargando catalogos/)).not.toBeInTheDocument());
  await user.click(screen.getByRole("tab", { name: /Unidades/ }));
  await screen.findByText("Avance");
  return user;
}

describe("Catalogos units", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listPeriods.mockResolvedValue([]);
    api.listUnits.mockResolvedValue(units);
    for (const fn of [api.createUnit, api.updateUnit, api.setActive, api.removeUnit]) fn.mockResolvedValue(undefined);
  });

  it("lists the units alphabetically with their type, description and status", async () => {
    await setup();

    expect(screen.getAllByText(/^(Avance|Zonas)$/).map((node) => node.textContent)).toEqual(["Avance", "Zonas"]);
    expect(screen.getByText("Porcentaje de avance")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Inactiva")).toBeInTheDocument();
  });

  it("shows the capture rule of the selected type", async () => {
    const user = await setup();
    expect(screen.getByRole("status")).toHaveTextContent("Acepta valores numericos, incluidos decimales.");

    await user.selectOptions(screen.getByLabelText(/^Tipo de dato/), "BOOLEANA");
    expect(screen.getByRole("status")).toHaveTextContent("Acepta unicamente Si o No.");
  });

  it("rejects a blank name and a duplicate name", async () => {
    const user = await setup();
    await user.type(nameField(), "   ");
    await submit(user);
    expect(await screen.findByText("El nombre de la unidad es obligatorio.")).toBeInTheDocument();

    await user.clear(nameField());
    await user.type(nameField(), " avance ");
    await submit(user);
    expect(await screen.findByText("Ya existe una unidad con ese nombre.")).toBeInTheDocument();
    expect(api.createUnit).not.toHaveBeenCalled();
  });

  it("creates a unit with a trimmed description", async () => {
    const user = await setup();
    await user.type(nameField(), " Grupos ");
    await user.selectOptions(screen.getByLabelText(/^Tipo de dato/), "BOOLEANA");
    await user.type(screen.getByLabelText("Descripcion"), "  Grupos activos ");
    await submit(user);

    await waitFor(() => expect(api.createUnit).toHaveBeenCalledWith({ name: "Grupos", type: "BOOLEANA", description: "Grupos activos" }));
    expect(toast.success).toHaveBeenCalledWith("Unidad creada");
    await waitFor(() => expect(nameField()).toHaveValue(""));
  });

  it("shows the API error when creating fails", async () => {
    api.createUnit.mockRejectedValue(new ApiError("Nombre invalido", 400));
    const user = await setup();
    await user.type(nameField(), "Grupos");
    await submit(user);

    expect(await screen.findByText("Nombre invalido")).toBeInTheDocument();
    expect(nameField()).toHaveValue("Grupos");
  });

  it("edits a unit, warns that the type is fixed and cancels", async () => {
    const user = await setup();
    await user.click(screen.getAllByTitle("Editar")[0]);

    expect(screen.getByRole("heading", { name: "Editar unidad" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("El tipo no puede cambiarse si la unidad ya esta en uso.");
    expect(screen.getByLabelText("Descripcion")).toHaveValue("Porcentaje de avance");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Nueva unidad" })).toBeInTheDocument();

    await user.click(screen.getAllByTitle("Editar")[1]);
    expect(screen.getByLabelText("Descripcion")).toHaveValue("");
    await user.clear(nameField());
    await user.type(nameField(), "Zonas norte");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.updateUnit).toHaveBeenCalledWith(2, { name: "Zonas norte", type: "OTRA" }));
    expect(toast.success).toHaveBeenCalledWith("Unidad actualizada");
  });

  it("inactivates and activates units", async () => {
    const user = await setup();
    await user.click(screen.getByTitle("Inactivar unidad"));
    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(1, false));
    expect(toast.success).toHaveBeenCalledWith("Unidad inactivada");

    await user.click(screen.getByTitle("Activar unidad"));
    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(2, true));
    expect(toast.success).toHaveBeenCalledWith("Unidad activada");
  });

  it("reports a failed activation change", async () => {
    api.setActive.mockRejectedValue(new Error("No se pudo cambiar"));
    const user = await setup();
    await user.click(screen.getByTitle("Inactivar unidad"));

    expect(await screen.findByText("No se pudo cambiar")).toBeInTheDocument();
  });

  it("explains that a unit in use cannot be deleted", async () => {
    api.removeUnit.mockRejectedValue(new ApiError("conflicto", 409));
    const user = await setup();
    await user.click(screen.getAllByTitle("Eliminar")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    const message = "No se puede eliminar porque esta en uso. Puedes marcarla como inactiva.";
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(message);
  });

  it("shows any other deletion error as received", async () => {
    api.removeUnit.mockRejectedValue("falla");
    const user = await setup();
    await user.click(screen.getAllByTitle("Eliminar")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Ocurrio un error inesperado."));
  });
});
