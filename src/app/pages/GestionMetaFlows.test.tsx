import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
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
  startDate: "2026-01-01",
  endDate: "2026-12-31",
};

const units = [
  { id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true },
  { id: 2, name: "Cumplido", type: "BOOLEANA", active: true },
  { id: 3, name: "Retirada", type: "OTRA", active: false },
];

function renderAt(url = "/jerarquia/metas/7/gestionar") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/jerarquia/metas/:goalId/gestionar" element={<GestionMeta />} />
        <Route path="/jerarquia" element={<p>Pagina de jerarquia</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GestionMeta flows", () => {
  afterEach(cleanup);
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue(goal);
    api.update.mockReset().mockResolvedValue({ ...goal, name: "Nueva" });
    api.setActive.mockReset().mockResolvedValue({ ...goal, status: "INACTIVA" });
    api.listUnits.mockReset().mockResolvedValue(units);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("offers active units and the goal's own unit even when retired", async () => {
    api.get.mockResolvedValue({ ...goal, measurementUnitId: 3, measurementUnitName: "Retirada" });
    renderAt();
    expect(await screen.findByRole("option", { name: "Retirada" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Cumplido" })).toBeInTheDocument();
  });

  it("shows placeholders when the goal has no indicator, value or dates", async () => {
    api.get.mockResolvedValue({ ...goal, referenceIndicator: undefined, expectedValue: Number.NaN, startDate: undefined, endDate: undefined });
    renderAt();
    await screen.findByRole("heading", { name: "Permanencia" });
    expect(screen.getByText("Sin indicador")).toBeInTheDocument();
    expect(screen.getAllByText("Sin fecha")).toHaveLength(2);
  });

  it("explains missing fields and clears an error when its field is edited", async () => {
    const user = userEvent.setup();
    renderAt();
    const name = await screen.findByLabelText("Nombre");
    await user.clear(name);
    await user.clear(screen.getByLabelText("Descripcion"));
    await user.clear(screen.getByLabelText("Indicador"));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripcion es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("El indicador de referencia es obligatorio.")).toBeInTheDocument();
    expect(api.update).not.toHaveBeenCalled();

    await user.type(name, "N");
    expect(screen.queryByText("El nombre es obligatorio.")).not.toBeInTheDocument();
  });

  it("rejects percentages above 100 and a closing date before the start", async () => {
    const user = userEvent.setup();
    renderAt();
    const value = await screen.findByLabelText("Valor esperado");
    await user.clear(value);
    await user.type(value, "150");
    await user.clear(screen.getByLabelText("Fecha cierre"));
    await user.type(screen.getByLabelText("Fecha cierre"), "2025-01-01");
    // The browser's own max check would block a click, so submit the form directly.
    fireEvent.submit(screen.getByRole("button", { name: /guardar cambios/i }).closest("form")!);

    expect(await screen.findByText("El porcentaje debe estar entre 0 y 100.")).toBeInTheDocument();
    expect(screen.getByText("La fecha de cierre debe ser posterior al inicio.")).toBeInTheDocument();
    expect(api.update).not.toHaveBeenCalled();
  });

  it("switches to a Yes/No answer for a boolean unit and saves it", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByLabelText("Valor esperado");
    await user.selectOptions(screen.getByRole("combobox"), "2");
    const answer = screen.getByRole("combobox", { name: "Valor esperado" });
    await user.selectOptions(answer, "No");
    await user.clear(screen.getByLabelText("Fecha inicio"));
    await user.clear(screen.getByLabelText("Fecha cierre"));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(api.update).toHaveBeenCalledWith(7, {
      name: "Permanencia",
      description: "Mejorar la permanencia.",
      referenceIndicator: "Tasa de permanencia",
      expectedValue: 0,
      measurementUnitId: 2,
    }));
    expect(toast.success).toHaveBeenCalledWith("Meta actualizada");
  });

  it("reports save failures with the message or a default", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByLabelText("Nombre");

    api.update.mockRejectedValueOnce(new Error("Nombre repetido"));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));

    api.update.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo actualizar la meta"));
  });

  it("reports status change failures with the message or a default", async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByRole("button", { name: /archivar meta/i }));
    api.setActive.mockRejectedValueOnce(new Error("Tiene KRs activos"));
    await user.click(within(await screen.findByRole("dialog", { name: "Archivar meta" })).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Tiene KRs activos"));

    await user.click(screen.getByRole("button", { name: /archivar meta/i }));
    api.setActive.mockRejectedValueOnce("falla");
    await user.click(within(await screen.findByRole("dialog", { name: "Archivar meta" })).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo cambiar el estado de la meta"));
  });

  it("goes back to the hierarchy from the header and from the load error", async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByRole("button", { name: /Jerarquia/ }));
    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
    cleanup();

    api.get.mockRejectedValueOnce("falla");
    renderAt();
    expect(await screen.findByText("No se pudo cargar la meta", { selector: "p:first-child" })).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("No se pudo cargar la meta");
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
  });

  it("shows a not-found state for an invalid id", async () => {
    const user = userEvent.setup();
    renderAt("/jerarquia/metas/abc/gestionar");
    expect(await screen.findByText("Meta no encontrada")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
  });
});
