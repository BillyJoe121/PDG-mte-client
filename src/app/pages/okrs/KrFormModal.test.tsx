import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { MeasurementUnit } from "../../services/catalogsApi";
import type { KeyResult } from "../../services/strategicApi";
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
  { id: 2, name: "Cupos", type: "NUMERICA", active: false },
  { id: 3, name: "Horas", type: "NUMERICA", active: false },
];

const keyResult = {
  id: 9,
  name: "Elevar permanencia",
  description: "Mide la permanencia.",
  metric: "Tasa",
  baseValue: 10,
  targetValue: 20,
  currentValue: 12,
  progressPercentage: 20,
  measurementUnitId: 2,
  measurementUnitName: "Cupos",
  academicPeriodId: 4,
  goals: [{ id: 3, name: "Graduación oportuna" }],
  strategicBets: [],
  status: "ACTIVO",
} as unknown as KeyResult;

describe("KrFormModal units", () => {
  beforeAll(() => {
    // Radix Select relies on pointer-capture and scroll APIs that jsdom lacks.
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => undefined;
    Element.prototype.scrollIntoView ??= () => undefined;
  });

  beforeEach(() => {
    mocks.loadMeasurementUnits.mockReset().mockResolvedValue(units);
    mocks.loadAcademicPeriods.mockReset().mockResolvedValue([{ id: 4, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-30", status: "ACTIVO" }]);
    mocks.loadGoals.mockReset().mockResolvedValue([]);
    mocks.loadStrategicBets.mockReset().mockResolvedValue([]);
  });

  it("keeps the current inactive unit selected and marked, without offering other inactive units", async () => {
    const user = userEvent.setup();
    render(<KrFormModal keyResult={keyResult} saving={false} onClose={() => undefined} onSubmit={async () => undefined} />);

    const trigger = await screen.findByRole("combobox", { name: "Unidad de medida" });
    await waitFor(() => expect(trigger).toHaveTextContent("Cupos (inactiva)"));

    await user.click(trigger);
    expect(await screen.findByRole("option", { name: "Porcentaje" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Horas/ })).not.toBeInTheDocument();
  });

  it("does not offer inactive units when creating", async () => {
    const user = userEvent.setup();
    render(<KrFormModal keyResult={null} saving={false} onClose={() => undefined} onSubmit={async () => undefined} />);

    await user.click(await screen.findByRole("combobox", { name: "Unidad de medida" }));
    expect(await screen.findByRole("option", { name: "Porcentaje" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Cupos/ })).not.toBeInTheDocument();
  });
});
