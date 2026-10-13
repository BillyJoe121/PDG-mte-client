import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import type { KeyResult } from "../../services/strategicApi";
import { KrForm } from "./KrForm";

const units: MeasurementUnit[] = [{ id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true }];
const periods: AcademicPeriod[] = [{ id: 4, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-30", status: "ACTIVO" }];
const goals = [{ id: 3, name: "Graduación oportuna" }];
const strategicBets = [{ id: 8, name: "Transformación digital" }];

const unlinkedKeyResult: KeyResult = {
  id: 11,
  name: "Elevar permanencia",
  description: "Mide la permanencia estudiantil.",
  metric: "Tasa de permanencia",
  baseValue: 70,
  targetValue: 90,
  currentValue: 75,
  progressPercentage: 25,
  measurementUnitId: 1,
  measurementUnitName: "Porcentaje",
  academicPeriodId: 4,
  academicPeriodName: "2026-1",
  goals: [],
  strategicBets: [],
  status: "ACTIVO",
  createdAt: "2026-01-10",
};

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <KrForm
      initial={unlinkedKeyResult}
      saving={false}
      units={units}
      periods={periods}
      goals={goals}
      strategicBets={strategicBets}
      onCancel={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("KrForm", () => {
  it("blocks saving until at least one Meta or Apuesta is selected", async () => {
    const onSubmit = renderForm();

    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(await screen.findByText("Selecciona al menos una Meta o una Apuesta.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "Metas" })).toHaveAttribute("aria-invalid", "true");
  });

  it("submits the selected Metas and Apuestas with the academic period", async () => {
    const onSubmit = renderForm();

    fireEvent.click(screen.getByRole("checkbox", { name: "Graduación oportuna" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Transformación digital" }));
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      academicPeriodId: 4,
      goalIds: [3],
      strategicBetIds: [8],
    }));
    expect(screen.queryByText("Selecciona al menos una Meta o una Apuesta.")).not.toBeInTheDocument();
  });
});
