import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
        <Route path="/jerarquia" element={<p>Pagina de jerarquia</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GestionMeta", () => {
  afterEach(() => {
    cleanup();
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

  it("goes back to the hierarchy when the dialog is cancelled", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
    expect(api.update).not.toHaveBeenCalled();
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

  it("archives the goal without deleting it after confirming", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /archivar meta/i }));
    const dialog = await screen.findByRole("dialog", { name: "Archivar meta" });
    expect(api.setActive).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));

    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(7, false));
    expect(await screen.findByRole("button", { name: /restaurar meta/i })).toBeInTheDocument();
  });

  it("keeps the goal active when the archive confirmation is cancelled", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /archivar meta/i }));
    const dialog = await screen.findByRole("dialog", { name: "Archivar meta" });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Archivar meta" })).not.toBeInTheDocument());
    expect(api.setActive).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /archivar meta/i })).toBeInTheDocument();
  });

  it("restores an archived goal without asking for confirmation", async () => {
    api.get.mockResolvedValue({ ...goal, status: "INACTIVA" });
    api.setActive.mockResolvedValue(goal);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /restaurar meta/i }));

    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(7, true));
    expect(screen.queryByRole("dialog", { name: "Archivar meta" })).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /archivar meta/i })).toBeInTheDocument();
  });
});
