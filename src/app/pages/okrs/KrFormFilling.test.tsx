import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { chooseOption, installRadixSelectPolyfills } from "../../../test/radixSelect";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import { KrForm } from "./KrForm";
import { KrFormModal } from "./KrFormModal";

const mocks = vi.hoisted(() => ({
  loadMeasurementUnits: vi.fn(),
  loadAcademicPeriods: vi.fn(),
  loadGoals: vi.fn(),
  loadStrategicBets: vi.fn(),
}));

vi.mock("../../services/screenDataCache", () => mocks);

const units: MeasurementUnit[] = [
  { id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true },
  { id: 2, name: "Cumplido", type: "BOOLEANA", active: true },
];
const periods: AcademicPeriod[] = [{ id: 4, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-30", status: "ACTIVO" }];
const goals = [{ id: 3, name: "Graduación oportuna" }];
const bets = [{ id: 8, name: "Transformación digital" }];

function renderForm(props: Partial<Parameters<typeof KrForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const onDirtyChange = vi.fn();
  render(
    <KrForm initial={null} saving={false} units={units} periods={periods} goals={goals} strategicBets={bets} onCancel={onCancel} onSubmit={onSubmit} onDirtyChange={onDirtyChange} {...props} />,
  );
  return { onSubmit, onCancel, onDirtyChange };
}

describe("KrForm filling", () => {
  beforeAll(installRadixSelectPolyfills);

  it("shows the first problem on top and marks every invalid field when saving an empty form", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("El nombre del KR es obligatorio.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Descripción")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Métrica")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Selecciona al menos una Meta o una Apuesta.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("fills every field and submits a complete request", async () => {
    const user = userEvent.setup();
    const { onSubmit, onDirtyChange } = renderForm();

    await user.type(screen.getByLabelText("Nombre"), "  Elevar retención ");
    await user.type(screen.getByLabelText("Descripción"), "Mide la retención.");
    await user.type(screen.getByLabelText("Métrica"), "Tasa");
    await chooseOption(user, "Unidad de medida", "Porcentaje");
    await user.clear(screen.getByLabelText("Valor base"));
    await user.type(screen.getByLabelText("Valor base"), "10");
    await user.type(screen.getByLabelText("Valor meta"), "90");
    await chooseOption(user, "Periodo académico", "2026-1");
    await user.click(screen.getByRole("checkbox", { name: "Transformación digital" }));
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: "Elevar retención",
      description: "Mide la retención.",
      metric: "Tasa",
      baseValue: 10,
      targetValue: 90,
      measurementUnitId: 1,
      academicPeriodId: 4,
      goalIds: [],
      strategicBetIds: [8],
    }));
  });

  it("answers Sí or No for a boolean unit", async () => {
    const user = userEvent.setup();
    renderForm();
    await chooseOption(user, "Unidad de medida", "Cumplido");
    const base = screen.getByRole("combobox", { name: "Valor base" });
    await user.selectOptions(base, "No");
    await user.selectOptions(screen.getByRole("combobox", { name: "Valor meta" }), "Sí");
    expect(base).toHaveValue("0");
    expect(screen.getByRole("combobox", { name: "Valor meta" })).toHaveValue("1");
  });

  it("starts from the given defaults when creating", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ defaults: { goalIds: [3], strategicBetIds: [8], academicPeriodId: 4 } });
    expect(screen.getByRole("checkbox", { name: "Graduación oportuna" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Transformación digital" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Periodo académico" })).toHaveTextContent("2026-1");

    await user.click(screen.getByRole("checkbox", { name: "Graduación oportuna" }));
    expect(screen.getByRole("checkbox", { name: "Graduación oportuna" })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("cancels from the form actions and hides them when the host provides its own", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("omits the built-in actions when asked", () => {
    renderForm({ hideActions: true, formId: "kr-host-form" });
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
    expect(document.getElementById("kr-host-form")).toBeInTheDocument();
  });
});

describe("KrFormModal", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    mocks.loadMeasurementUnits.mockReset().mockResolvedValue(units);
    mocks.loadAcademicPeriods.mockReset().mockResolvedValue(periods);
    mocks.loadGoals.mockReset().mockResolvedValue(goals);
    mocks.loadStrategicBets.mockReset().mockResolvedValue(bets);
    vi.mocked(toast.error).mockClear();
  });

  it("keeps saving disabled while options load, then shows the form with the given defaults", async () => {
    render(<KrFormModal defaults={{ goalIds: [3] }} saving={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Cargando metas y apuestas...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();

    expect(await screen.findByRole("checkbox", { name: "Graduación oportuna" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  it("closes and reports the failure when the options cannot be loaded", async () => {
    mocks.loadGoals.mockRejectedValueOnce(new Error("Catálogo caído"));
    const onClose = vi.fn();
    const { unmount } = render(<KrFormModal saving={false} onClose={onClose} onSubmit={vi.fn()} />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Catálogo caído"));
    expect(onClose).toHaveBeenCalled();
    unmount();

    mocks.loadStrategicBets.mockRejectedValueOnce("falla");
    render(<KrFormModal saving={false} onClose={onClose} onSubmit={vi.fn()} />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudieron cargar las metas y apuestas"));
  });

  it("ignores options that arrive after closing", async () => {
    let finish: (value: unknown[]) => void = () => undefined;
    mocks.loadGoals.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { unmount } = render(<KrFormModal saving={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    unmount();
    finish(goals);
    await Promise.resolve();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("ignores an options failure that arrives after closing", async () => {
    let fail: (reason: unknown) => void = () => undefined;
    mocks.loadGoals.mockReturnValue(new Promise((_, reject) => { fail = reject; }));
    const onClose = vi.fn();
    const { unmount } = render(<KrFormModal saving={false} onClose={onClose} onSubmit={vi.fn()} />);
    unmount();
    fail(new Error("tarde"));
    await Promise.resolve();
    expect(toast.error).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes from Cancelar once loaded", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KrFormModal saving={false} onClose={onClose} onSubmit={vi.fn()} />);
    await screen.findByRole("checkbox", { name: "Graduación oportuna" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
  });
});
