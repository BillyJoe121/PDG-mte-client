import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listPeriods: vi.fn(),
  createPeriod: vi.fn(),
  updatePeriod: vi.fn(),
  updateStatus: vi.fn(),
  setActive: vi.fn(),
  removePeriod: vi.fn(),
  listUnits: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { id: "U1", rol: "admin" } }) }));
vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return {
    ...original,
    academicPeriodsApi: { list: api.listPeriods, create: api.createPeriod, update: api.updatePeriod, updateStatus: api.updateStatus, setActive: api.setActive, remove: api.removePeriod },
    measurementUnitsApi: { list: api.listUnits, create: vi.fn(), update: vi.fn(), setActive: vi.fn(), remove: vi.fn() },
  };
});

import { ApiError } from "../services/catalogsApi";
import { Catalogos } from "./Catalogos";

const periods = [
  { id: 2, name: "2025-2", startDate: "2025-07-01", endDate: "2025-12-15", status: "CERRADO" },
  { id: 1, name: "2026-1", startDate: "2026-01-15", endDate: "2026-06-30", status: "ACTIVO" },
  { id: 3, name: "2027-1", startDate: "2027-01-15", endDate: "2027-06-30", status: "PLANIFICACION" },
];

const dates = () => Array.from(document.querySelectorAll<HTMLInputElement>('input[type="date"]'));
const nameField = () => screen.getByRole("textbox", { name: "Nombre del periodo" });
const create = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Crear" }));

async function setup() {
  const user = userEvent.setup();
  render(<Catalogos />);
  await screen.findByText("2026-1");
  return user;
}

describe("Catalogos periods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listPeriods.mockResolvedValue(periods);
    api.listUnits.mockResolvedValue([]);
    for (const fn of [api.createPeriod, api.updatePeriod, api.updateStatus, api.setActive, api.removePeriod]) fn.mockResolvedValue(undefined);
  });

  it("shows a loading state and lists the periods from the newest", async () => {
    render(<Catalogos />);

    expect(screen.getByText(/Cargando catalogos/)).toBeInTheDocument();
    await screen.findByText("2026-1");
    expect(screen.getAllByText(/^20\d\d-[12]$/).map((node) => node.textContent)).toEqual(["2027-1", "2026-1", "2025-2"]);
  });

  it("explains when there are no periods", async () => {
    api.listPeriods.mockResolvedValue([]);
    render(<Catalogos />);

    expect(await screen.findByText("No hay periodos academicos registrados.")).toBeInTheDocument();
  });

  it("reports a load error, including an unknown failure", async () => {
    api.listPeriods.mockRejectedValueOnce(new ApiError("Servicio caido", 500)).mockRejectedValueOnce("falla");
    const user = userEvent.setup();
    render(<Catalogos />);

    expect(await screen.findByText("Servicio caido")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Recargar/ }));
    expect(await screen.findByText("Ocurrio un error inesperado.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Recargar/ }));
    expect(await screen.findByText("2026-1")).toBeInTheDocument();
    expect(screen.queryByText("Ocurrio un error inesperado.")).not.toBeInTheDocument();
  });

  it("validates a period before creating it", async () => {
    const user = await setup();

    await create(user);
    expect(await screen.findByText("El nombre del periodo es obligatorio.")).toBeInTheDocument();
    await user.type(nameField(), "2028-1");
    await create(user);
    expect(await screen.findByText("La fecha de inicio es obligatoria.")).toBeInTheDocument();
    fireEvent.change(dates()[0], { target: { value: "2028-02-01" } });
    await create(user);
    expect(await screen.findByText("La fecha de fin es obligatoria.")).toBeInTheDocument();
    fireEvent.change(dates()[1], { target: { value: "2028-02-01" } });
    await create(user);
    expect(await screen.findByText("La fecha fin debe ser posterior a la fecha inicio.")).toBeInTheDocument();
    fireEvent.change(dates()[1], { target: { value: "2028-06-01" } });
    await user.clear(nameField());
    await user.type(nameField(), "2026-1");
    await create(user);
    expect(await screen.findByText("Ya existe un periodo con ese nombre.")).toBeInTheDocument();
    expect(api.createPeriod).not.toHaveBeenCalled();
  });

  it("creates a period with the chosen status and reloads the list", async () => {
    const user = await setup();
    await user.type(nameField(), "2028-1");
    fireEvent.change(dates()[0], { target: { value: "2028-02-01" } });
    fireEvent.change(dates()[1], { target: { value: "2028-06-01" } });
    await user.selectOptions(screen.getAllByRole("combobox")[0], "ACTIVO");
    await create(user);

    await waitFor(() => expect(api.createPeriod).toHaveBeenCalledWith({ name: "2028-1", startDate: "2028-02-01", endDate: "2028-06-01", status: "ACTIVO" }));
    expect(toast.success).toHaveBeenCalledWith("Periodo creado");
    await waitFor(() => expect(api.listPeriods).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(nameField()).toHaveValue(""));
  });

  it("shows the API error when creating fails and keeps the form", async () => {
    api.createPeriod.mockRejectedValue(new ApiError("Fechas solapadas", 400));
    const user = await setup();
    await user.type(nameField(), "2028-1");
    fireEvent.change(dates()[0], { target: { value: "2028-02-01" } });
    fireEvent.change(dates()[1], { target: { value: "2028-06-01" } });
    await create(user);

    expect(await screen.findByText("Fechas solapadas")).toBeInTheDocument();
    expect(nameField()).toHaveValue("2028-1");
    expect(screen.getByRole("button", { name: "Crear" })).toBeEnabled();
  });

  it("edits a period, allows keeping its own name and cancels the edition", async () => {
    const user = await setup();
    await user.click(screen.getAllByTitle("Editar")[1]);

    expect(screen.getByRole("heading", { name: "Editar periodo" })).toBeInTheDocument();
    expect(nameField()).toHaveValue("2026-1");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Nuevo periodo" })).toBeInTheDocument();
    expect(nameField()).toHaveValue("");

    await user.click(screen.getAllByTitle("Editar")[1]);
    fireEvent.change(dates()[1], { target: { value: "2026-07-31" } });
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.updatePeriod).toHaveBeenCalledWith(1, { name: "2026-1", startDate: "2026-01-15", endDate: "2026-07-31", status: "ACTIVO" }));
    expect(toast.success).toHaveBeenCalledWith("Periodo actualizado");
  });

  it("changes the status of a period from its row", async () => {
    const user = await setup();
    await user.selectOptions(screen.getAllByTitle("Cambiar estado")[0], "ACTIVO");

    await waitFor(() => expect(api.updateStatus).toHaveBeenCalledWith(3, "ACTIVO"));
    expect(toast.success).toHaveBeenCalledWith("Estado del periodo actualizado");
  });

  it("reports a failed status change", async () => {
    api.updateStatus.mockRejectedValue(new Error("Ya hay un periodo activo"));
    const user = await setup();
    await user.selectOptions(screen.getAllByTitle("Cambiar estado")[0], "ACTIVO");

    expect(await screen.findByText("Ya hay un periodo activo")).toBeInTheDocument();
  });

  it("closes the active period and activates an inactive one", async () => {
    const user = await setup();
    await user.click(screen.getByTitle("Cerrar periodo"));
    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(1, false));
    expect(toast.success).toHaveBeenCalledWith("Periodo cerrado");

    await user.click(screen.getAllByTitle("Activar periodo")[0]);
    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(3, true));
    expect(toast.success).toHaveBeenCalledWith("Periodo activado");
  });

  it("reports a failed activation", async () => {
    api.setActive.mockRejectedValue(new Error("No se pudo activar"));
    const user = await setup();
    await user.click(screen.getByTitle("Cerrar periodo"));

    expect(await screen.findByText("No se pudo activar")).toBeInTheDocument();
  });

  it("explains that a period in use cannot be deleted", async () => {
    api.removePeriod.mockRejectedValue(new ApiError("conflicto", 409));
    const user = await setup();
    await user.click(screen.getAllByTitle("Eliminar")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    const message = "No se puede eliminar porque esta en uso. Puedes cerrarlo o desactivarlo.";
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(message);
  });

  it("shows any other deletion error as received", async () => {
    api.removePeriod.mockRejectedValue(new ApiError("Sin permiso", 403));
    const user = await setup();
    await user.click(screen.getAllByTitle("Eliminar")[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sin permiso"));
  });

  it("clears the message when the tab changes and shows the empty units list", async () => {
    api.createPeriod.mockRejectedValue(new Error("Fallo al crear"));
    const user = await setup();
    await user.type(nameField(), "2028-1");
    fireEvent.change(dates()[0], { target: { value: "2028-02-01" } });
    fireEvent.change(dates()[1], { target: { value: "2028-06-01" } });
    await create(user);
    await screen.findByText("Fallo al crear");

    await user.click(screen.getByRole("tab", { name: /Unidades/ }));
    expect(screen.queryByText("Fallo al crear")).not.toBeInTheDocument();
    expect(screen.getByText("No hay unidades de medida registradas.")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Periodos/ }));
    expect(screen.getByRole("heading", { name: "Nuevo periodo" })).toBeInTheDocument();
  });
});
