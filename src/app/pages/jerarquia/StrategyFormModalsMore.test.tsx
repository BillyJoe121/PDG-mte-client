import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { installRadixSelectPolyfills } from "../../../test/radixSelect";
import { GoalFormModal, StrategicBetFormModal } from "./StrategyFormModals";

const api = vi.hoisted(() => ({
  betCreate: vi.fn(),
  goalCreate: vi.fn(),
  listUnits: vi.fn(),
}));

vi.mock("../../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../services/strategicApi")>();
  return {
    ...original,
    strategicBetsApi: { ...original.strategicBetsApi, create: api.betCreate },
    goalsApi: { ...original.goalsApi, create: api.goalCreate },
  };
});

vi.mock("../../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../services/catalogsApi")>();
  return { ...original, measurementUnitsApi: { ...original.measurementUnitsApi, list: api.listUnits } };
});

// The calendar opens on the current month, so the dates under test are built from today.
const now = new Date();
const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

type User = ReturnType<typeof userEvent.setup>;

async function pickDay(user: User, label: string, day: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(`^${label}:`) }));
  const cell = await screen.findByRole("gridcell", { name: day });
  await user.click(cell.querySelector("button") ?? cell);
}

beforeAll(installRadixSelectPolyfills);

describe("StrategicBetFormModal dates and failures", () => {
  beforeEach(() => {
    api.betCreate.mockReset().mockResolvedValue({});
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("rejects a closing date that is not after the start and accepts a later one", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn().mockResolvedValue(undefined);
    render(<StrategicBetFormModal onClose={() => undefined} onCreated={onCreated} />);

    await user.type(screen.getByLabelText("Nombre"), "Apuesta");
    await user.type(screen.getByLabelText("Descripcion"), "Detalle");
    await pickDay(user, "Fecha inicio", "20");
    await pickDay(user, "Fecha cierre", "10");
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    expect(await screen.findByText("La fecha de cierre debe ser posterior al inicio.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Fecha cierre:/ })).toHaveAttribute("aria-invalid", "true");
    expect(api.betCreate).not.toHaveBeenCalled();

    await pickDay(user, "Fecha cierre", "25");
    expect(screen.queryByText("La fecha de cierre debe ser posterior al inicio.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(api.betCreate).toHaveBeenCalledWith({
      name: "Apuesta",
      description: "Detalle",
      startDate: `${monthPrefix}-20`,
      endDate: `${monthPrefix}-25`,
    });
  });

  it("reports a creation failure with the message or a default", async () => {
    const user = userEvent.setup();
    render(<StrategicBetFormModal onClose={() => undefined} onCreated={vi.fn()} />);
    await user.type(screen.getByLabelText("Nombre"), "Apuesta");
    await user.type(screen.getByLabelText("Descripcion"), "Detalle");

    api.betCreate.mockRejectedValueOnce(new Error("Nombre repetido"));
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));

    api.betCreate.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo crear la apuesta"));
  });
});

describe("GoalFormModal units, dates and failures", () => {
  beforeEach(() => {
    api.goalCreate.mockReset().mockResolvedValue({});
    api.listUnits.mockReset().mockResolvedValue([
      { id: 1, name: "Cursos", type: "NUMERICA", active: true },
      { id: 2, name: "Cumplido", type: "BOOLEANA", active: true },
    ]);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  async function fillText(user: User) {
    await user.type(screen.getByLabelText("Nombre"), "Meta");
    await user.type(screen.getByLabelText("Descripcion"), "Detalle");
    await user.type(screen.getByLabelText("Indicador"), "Indicador");
  }

  async function chooseUnit(user: User, name: string) {
    const unit = await screen.findByRole("combobox", { name: "Unidad" });
    await waitFor(() => expect(unit).toBeEnabled());
    await user.click(unit);
    await user.click(await screen.findByRole("option", { name }));
  }

  it("asks for a Yes/No answer when the unit is boolean and sends it", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn().mockResolvedValue(undefined);
    render(<GoalFormModal onClose={() => undefined} onCreated={onCreated} />);
    await fillText(user);
    await chooseUnit(user, "Cumplido");

    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    expect(await screen.findByText("El valor esperado es obligatorio y debe ser numerico.")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Valor esperado" }), "Si");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(api.goalCreate).toHaveBeenCalledWith(expect.objectContaining({ expectedValue: 1, measurementUnitId: 2 }));
  });

  it("sends the chosen dates and rejects a closing date before the start", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn().mockResolvedValue(undefined);
    render(<GoalFormModal onClose={() => undefined} onCreated={onCreated} />);
    await fillText(user);
    await chooseUnit(user, "Cursos");
    await user.type(screen.getByLabelText("Valor esperado"), "4");
    await pickDay(user, "Fecha inicio", "20");
    await pickDay(user, "Fecha cierre", "10");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    expect(await screen.findByText("La fecha de cierre debe ser posterior al inicio.")).toBeInTheDocument();

    await pickDay(user, "Fecha cierre", "25");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(api.goalCreate).toHaveBeenCalledWith(expect.objectContaining({ startDate: `${monthPrefix}-20`, endDate: `${monthPrefix}-25` }));
  });

  it("reports a creation failure with the message or a default", async () => {
    const user = userEvent.setup();
    render(<GoalFormModal onClose={() => undefined} onCreated={vi.fn()} />);
    await fillText(user);
    await chooseUnit(user, "Cursos");
    await user.type(screen.getByLabelText("Valor esperado"), "4");

    api.goalCreate.mockRejectedValueOnce(new Error("Nombre repetido"));
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));

    api.goalCreate.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo crear la meta"));
  });

  it("reports a unit loading failure with the message or a default", async () => {
    api.listUnits.mockRejectedValueOnce(new Error("Catálogo caído"));
    const { unmount } = render(<GoalFormModal onClose={() => undefined} onCreated={vi.fn()} />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Catálogo caído"));
    unmount();

    api.listUnits.mockRejectedValueOnce("falla");
    render(<GoalFormModal onClose={() => undefined} onCreated={vi.fn()} />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudieron cargar las unidades"));
  });
});
