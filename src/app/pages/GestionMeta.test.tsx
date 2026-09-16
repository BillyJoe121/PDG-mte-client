import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GestionMeta } from "./GestionMeta";

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), setActive: vi.fn(), listUnits: vi.fn() }));

vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, goalsApi: { ...original.goalsApi, get: api.get, update: api.update, setActive: api.setActive } };
});

vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return { ...original, measurementUnitsApi: { ...original.measurementUnitsApi, list: api.listUnits } };
});

const goal = {
  id: 7,
  name: "Permanencia",
  description: "Mejorar la permanencia.",
  referenceIndicator: "Tasa de permanencia",
  expectedValue: 90,
  measurementUnitId: 1,
  measurementUnitName: "Porcentaje",
  status: "ACTIVA" as const,
  createdAt: "2026-01-01T00:00:00Z",
  periods: [],
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/jerarquia/metas/7/gestionar"]}>
      <Routes>
        <Route path="/jerarquia/metas/:goalId/gestionar" element={<GestionMeta />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GestionMeta", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue(goal);
    api.update.mockReset().mockResolvedValue({ ...goal, expectedValue: 95 });
    api.setActive.mockReset().mockResolvedValue({ ...goal, status: "INACTIVA" });
    api.listUnits.mockReset().mockResolvedValue([
      { id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true },
    ]);
  });

  it("shows the indicator and expected value and saves the route goal", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Tasa de permanencia")).toBeInTheDocument();
    expect(screen.getByText("90 Porcentaje")).toBeInTheDocument();
    const value = screen.getByLabelText("Valor esperado");
    await user.clear(value);
    await user.type(value, "95");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(api.update).toHaveBeenCalledWith(7, expect.objectContaining({
      referenceIndicator: "Tasa de permanencia",
      expectedValue: 95,
      measurementUnitId: 1,
    })));
  });

  it("offers retry after a load failure", async () => {
    api.get.mockRejectedValueOnce(new Error("Servicio temporalmente no disponible")).mockResolvedValueOnce(goal);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("No se pudo cargar la meta")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(await screen.findByText("Tasa de permanencia")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("archives the goal without deleting it", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /archivar meta/i }));

    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(7, false));
    expect(await screen.findByRole("button", { name: /restaurar meta/i })).toBeInTheDocument();
  });
});
