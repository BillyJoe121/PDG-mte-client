import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GestionApuesta } from "./GestionApuesta";

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), setActive: vi.fn() }));

vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, strategicBetsApi: { ...original.strategicBetsApi, get: api.get, update: api.update, setActive: api.setActive } };
});

const bet = {
  id: 5,
  name: "Transformacion digital",
  description: "Fortalecer capacidades digitales.",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: "ACTIVA" as const,
  createdAt: "2026-01-01T00:00:00Z",
  executionSummary: {
    summaryText: "Sin ejecucion",
    completedObjectives: 0,
    inProgressObjectives: 0,
    completedKeyResults: 0,
    inProgressKeyResults: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    periods: [],
  },
};

describe("GestionApuesta", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue(bet);
    api.update.mockReset().mockResolvedValue({ ...bet, name: "Transformacion digital institucional" });
    api.setActive.mockReset().mockResolvedValue({ ...bet, status: "INACTIVA" });
  });

  it("loads and updates the bet identified by the route", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/jerarquia/apuestas/5/gestionar"]}>
        <Routes>
          <Route path="/jerarquia/apuestas/:betId/gestionar" element={<GestionApuesta />} />
        </Routes>
      </MemoryRouter>,
    );

    const name = await screen.findByLabelText("Nombre");
    await user.clear(name);
    await user.type(name, "Transformacion digital institucional");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(api.update).toHaveBeenCalledWith(5, expect.objectContaining({
      name: "Transformacion digital institucional",
    })));
  });

  it("offers retry after a load failure", async () => {
    api.get.mockRejectedValueOnce(new Error("Servicio temporalmente no disponible")).mockResolvedValueOnce(bet);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/jerarquia/apuestas/5/gestionar"]}>
        <Routes>
          <Route path="/jerarquia/apuestas/:betId/gestionar" element={<GestionApuesta />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("No se pudo cargar la apuesta")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(await screen.findByLabelText("Nombre")).toHaveValue("Transformacion digital");
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("archives the bet without deleting it", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/jerarquia/apuestas/5/gestionar"]}>
        <Routes><Route path="/jerarquia/apuestas/:betId/gestionar" element={<GestionApuesta />} /></Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: /archivar apuesta/i }));

    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(5, false));
    expect(await screen.findByRole("button", { name: /restaurar apuesta/i })).toBeInTheDocument();
  });
});
