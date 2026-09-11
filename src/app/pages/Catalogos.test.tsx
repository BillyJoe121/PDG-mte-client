import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Catalogos } from "./Catalogos";

const auth = vi.hoisted(() => ({ role: "admin" as "admin" | "user" }));
const api = vi.hoisted(() => ({
  listPeriods: vi.fn(),
  createPeriod: vi.fn(),
  listUnits: vi.fn(),
  createUnit: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { id: "U1", nombre: "Demo", correo: "demo@icesi.edu.co", rol: auth.role, iniciales: "DE" } }),
}));

vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return {
    ...original,
    academicPeriodsApi: {
      list: api.listPeriods,
      create: api.createPeriod,
      update: vi.fn(), updateStatus: vi.fn(), setActive: vi.fn(), remove: vi.fn(),
    },
    measurementUnitsApi: {
      list: api.listUnits,
      create: api.createUnit,
      update: vi.fn(), setActive: vi.fn(), remove: vi.fn(),
    },
  };
});

describe("Catalogos", () => {
  beforeEach(() => {
    auth.role = "admin";
    api.listPeriods.mockReset().mockResolvedValue([
      { id: 1, name: "2026-1", startDate: "2026-01-15", endDate: "2026-06-30", status: "ACTIVO" },
    ]);
    api.listUnits.mockReset().mockResolvedValue([
      { id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true },
    ]);
    api.createPeriod.mockReset().mockResolvedValue({});
    api.createUnit.mockReset().mockResolvedValue({});
  });

  it("permite al admin consultar periodos y unidades y crear una unidad", async () => {
    const user = userEvent.setup();
    render(<Catalogos />);

    expect(await screen.findByText("2026-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Unidades/i }));
    expect(screen.getAllByText("Porcentaje").length).toBeGreaterThan(1);

    await user.type(screen.getByPlaceholderText("Nombre, ej: proyectos"), "Estudiantes");
    await user.click(screen.getByRole("button", { name: /Crear/i }));

    await waitFor(() => expect(api.createUnit).toHaveBeenCalledWith({
      name: "Estudiantes",
      type: "NUMERICA",
    }));
  });

  it("bloquea la gestión de catálogos para user", async () => {
    auth.role = "user";
    render(<Catalogos />);
    expect(screen.getByRole("heading", { name: "Acceso restringido" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Crear/i })).not.toBeInTheDocument();
  });
});
