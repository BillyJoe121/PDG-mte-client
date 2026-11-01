import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";

const updateKeyResultProgress = vi.fn();

vi.mock("../../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/strategicApi")>();
  return { ...actual, updateKeyResultProgress: (...args: unknown[]) => updateKeyResultProgress(...args) };
});

import { ApiError } from "../../services/strategicApi";
import { KeyResultProgressForm, validateProgressDraft } from "./KeyResultProgressForm";

const keyResult: KeyResult = {
  id: 21,
  name: "Elevar permanencia",
  description: "",
  metric: "Tasa de permanencia",
  baseValue: 70,
  targetValue: 90,
  currentValue: 70,
  progressPercentage: 0,
  measurementUnitId: 1,
  measurementUnitName: "Porcentaje",
  goals: [],
  strategicBets: [],
  status: "ACTIVO",
  createdAt: "2026-01-10",
};

function fill(current: string, progress: string) {
  fireEvent.change(screen.getByLabelText("Valor actual (Porcentaje)"), { target: { value: current } });
  fireEvent.change(screen.getByLabelText("Avance registrado (%)"), { target: { value: progress } });
}

describe("validateProgressDraft", () => {
  it("requires both values and keeps progress between 0 and 100", () => {
    expect(validateProgressDraft({ currentValue: "", progressPercentage: "" })).toEqual({
      currentValue: "Ingresa el valor actual medido para este KR.",
      progressPercentage: "Ingresa el avance que registras, de 0 a 100.",
    });
    expect(validateProgressDraft({ currentValue: "5", progressPercentage: "101" }).progressPercentage).toBe("El avance debe estar entre 0 y 100 %.");
    expect(validateProgressDraft({ currentValue: "5", progressPercentage: "-1" }).progressPercentage).toBe("El avance debe estar entre 0 y 100 %.");
    expect(validateProgressDraft({ currentValue: "5", progressPercentage: "0" })).toEqual({});
    expect(validateProgressDraft({ currentValue: "5", progressPercentage: "100" })).toEqual({});
  });
});

describe("KeyResultProgressForm", () => {
  beforeEach(() => {
    updateKeyResultProgress.mockReset();
  });

  it("shows inline messages and does not call the API when values are missing", () => {
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Registrar avance" }));

    expect(screen.getByText("Ingresa el valor actual medido para este KR.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa el avance que registras, de 0 a 100.")).toBeInTheDocument();
    expect(updateKeyResultProgress).not.toHaveBeenCalled();
  });

  it("sends both recorded values together and reports the updated KR", async () => {
    const updated = { ...keyResult, currentValue: 78, progressPercentage: 40 };
    updateKeyResultProgress.mockResolvedValue(updated);
    const onRecorded = vi.fn().mockResolvedValue(undefined);
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={onRecorded} />);

    fill("78", "40");
    fireEvent.click(screen.getByRole("button", { name: "Registrar avance" }));

    await waitFor(() => expect(onRecorded).toHaveBeenCalledWith(updated));
    expect(updateKeyResultProgress).toHaveBeenCalledWith(21, { currentValue: 78, progressPercentage: 40 });
  });

  it("disables the submit button while saving", async () => {
    let resolve: (value: KeyResult) => void = () => undefined;
    updateKeyResultProgress.mockReturnValue(new Promise<KeyResult>((done) => { resolve = done; }));
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={vi.fn()} />);

    fill("72", "10");
    fireEvent.click(screen.getByRole("button", { name: "Registrar avance" }));

    expect(await screen.findByRole("button", { name: "Registrando..." })).toBeDisabled();
    resolve(keyResult);
    await waitFor(() => expect(screen.getByRole("button", { name: "Registrar avance" })).not.toBeDisabled());
  });

  it("shows the API error, for example when the KR is closed", async () => {
    updateKeyResultProgress.mockRejectedValue(new ApiError("El Key Result está cerrado y no admite cambios de avance", 409));
    const onRecorded = vi.fn();
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={onRecorded} />);

    fill("80", "50");
    fireEvent.click(screen.getByRole("button", { name: "Registrar avance" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El Key Result está cerrado y no admite cambios de avance");
    expect(onRecorded).not.toHaveBeenCalled();
  });
});
