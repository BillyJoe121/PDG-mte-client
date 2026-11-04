import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { GoalFormModal, StrategicBetFormModal } from "./StrategyFormModals";

const api = vi.hoisted(() => ({
  betCreate: vi.fn(),
  betUpdate: vi.fn(),
  goalCreate: vi.fn(),
  goalUpdate: vi.fn(),
  listUnits: vi.fn(),
}));

vi.mock("../../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../services/strategicApi")>();
  return {
    ...original,
    strategicBetsApi: { ...original.strategicBetsApi, create: api.betCreate, update: api.betUpdate },
    goalsApi: { ...original.goalsApi, create: api.goalCreate, update: api.goalUpdate },
  };
});

vi.mock("../../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../services/catalogsApi")>();
  return { ...original, measurementUnitsApi: { ...original.measurementUnitsApi, list: api.listUnits } };
});

const summary = { summaryText: "Sin ejecucion", completedKeyResults: 0, inProgressKeyResults: 0, completedProjects: 0, inProgressProjects: 0, periods: [] };

const bet = {
  id: 4,
  name: "Innovacion",
  description: "Renovar la oferta.",
  startDate: "2026-01-01",
  status: "ACTIVA",
  createdAt: "2026-01-01T00:00:00Z",
  executionSummary: summary,
} as unknown as StrategicBet;

const goal = {
  id: 7,
  name: "Permanencia",
  description: "Mejorar la permanencia.",
  referenceIndicator: "Tasa de permanencia",
  expectedValue: 20,
  measurementUnitId: 3,
  measurementUnitName: "Cupos",
  status: "ACTIVA",
  createdAt: "2026-01-01T00:00:00Z",
  periods: [],
  executionSummary: summary,
} as unknown as Goal;

const units = [
  { id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true },
  { id: 2, name: "Horas", type: "NUMERICA", active: false },
  { id: 3, name: "Cupos", type: "NUMERICA", active: false },
];

describe("StrategicBetFormModal", () => {
  beforeEach(() => {
    api.betCreate.mockReset().mockResolvedValue(bet);
    api.betUpdate.mockReset().mockResolvedValue(bet);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("creates with placeholders, validates first and sends trimmed values", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn().mockResolvedValue(undefined);
    render(<StrategicBetFormModal onClose={() => undefined} onCreated={onCreated} />);

    expect(screen.getByRole("dialog", { name: "Nueva Apuesta Estrategica" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej: Innovacion curricular")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    expect(await screen.findByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripcion es obligatoria.")).toBeInTheDocument();
    expect(api.betCreate).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Nombre"), "  Nueva apuesta  ");
    await user.type(screen.getByLabelText("Descripcion"), " Alcance definido ");
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(api.betCreate).toHaveBeenCalledWith({ name: "Nueva apuesta", description: "Alcance definido" });
    expect(api.betUpdate).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Apuesta estrategica creada");
  });

  it("edits the same form without placeholders and updates by id", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn().mockResolvedValue(undefined);
    render(<StrategicBetFormModal bet={bet} onClose={() => undefined} onSaved={onSaved} />);

    expect(screen.getByRole("dialog", { name: "Editar Apuesta Estrategica" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Ej: Innovacion curricular")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Innovacion");

    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "Innovacion curricular");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(api.betUpdate).toHaveBeenCalledWith(4, { name: "Innovacion curricular", description: "Renovar la oferta.", startDate: "2026-01-01" });
    expect(api.betCreate).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Apuesta actualizada");
  });

  it("reports the failure with the edit message and keeps the dialog open", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    api.betUpdate.mockRejectedValue("falla");
    render(<StrategicBetFormModal bet={bet} onClose={() => undefined} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo actualizar la apuesta"));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Editar Apuesta Estrategica" })).toBeInTheDocument();
  });
});

describe("GoalFormModal", () => {
  beforeAll(() => {
    // Radix Select relies on pointer-capture and scroll APIs that jsdom lacks.
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => undefined;
    Element.prototype.scrollIntoView ??= () => undefined;
  });

  beforeEach(() => {
    api.goalCreate.mockReset().mockResolvedValue(goal);
    api.goalUpdate.mockReset().mockResolvedValue(goal);
    api.listUnits.mockReset().mockResolvedValue(units);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("creates with placeholders and does not offer inactive units", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn().mockResolvedValue(undefined);
    render(<GoalFormModal onClose={() => undefined} onCreated={onCreated} />);

    expect(screen.getByRole("dialog", { name: "Nueva Meta Institucional" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej: Renovar propuesta curricular")).toBeInTheDocument();

    const unit = await screen.findByRole("combobox", { name: "Unidad" });
    await waitFor(() => expect(unit).toBeEnabled());

    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    expect(await screen.findByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(api.goalCreate).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Nombre"), "Retencion");
    await user.type(screen.getByLabelText("Descripcion"), "Reducir la desercion.");
    await user.type(screen.getByLabelText("Indicador"), "Tasa de retencion");
    await user.click(unit);
    expect(screen.queryByRole("option", { name: /Cupos/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: "Porcentaje" }));
    await user.type(screen.getByLabelText("Valor esperado"), "80");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(api.goalCreate).toHaveBeenCalledWith({
      name: "Retencion",
      description: "Reducir la desercion.",
      referenceIndicator: "Tasa de retencion",
      expectedValue: 80,
      measurementUnitId: 1,
    });
    expect(api.goalUpdate).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Meta institucional creada");
  });

  it("edits the same form, keeps the current inactive unit and updates by id", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn().mockResolvedValue(undefined);
    render(<GoalFormModal goal={goal} onClose={() => undefined} onSaved={onSaved} />);

    expect(screen.getByRole("dialog", { name: "Editar Meta Institucional" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Ej: Renovar propuesta curricular")).not.toBeInTheDocument();

    const unit = await screen.findByRole("combobox", { name: "Unidad" });
    await waitFor(() => expect(unit).toHaveTextContent("Cupos"));

    await user.click(unit);
    expect(await screen.findByRole("option", { name: "Porcentaje" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Cupos/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Horas/ })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(api.goalUpdate).toHaveBeenCalledWith(7, {
      name: "Permanencia",
      description: "Mejorar la permanencia.",
      referenceIndicator: "Tasa de permanencia",
      expectedValue: 20,
      measurementUnitId: 3,
    });
    expect(api.goalCreate).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Meta actualizada");
  });

  it("marks the unit field when there are no active units", async () => {
    api.listUnits.mockResolvedValue([{ id: 2, name: "Horas", type: "NUMERICA", active: false }]);
    render(<GoalFormModal onClose={() => undefined} onCreated={vi.fn()} />);

    const unit = await screen.findByRole("combobox", { name: "Unidad" });
    await waitFor(() => expect(unit).toHaveTextContent("Sin unidades activas"));
    expect(unit).toBeDisabled();
  });
});
