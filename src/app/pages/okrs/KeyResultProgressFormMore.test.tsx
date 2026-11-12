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

const keyResult = {
  id: 21,
  name: "Elevar permanencia",
  measurementUnitName: "Porcentaje",
  status: "ACTIVO",
} as KeyResult;

function fill(current: string, progress: string) {
  fireEvent.change(screen.getByLabelText("Valor actual (Porcentaje)"), { target: { value: current } });
  fireEvent.change(screen.getByLabelText("Avance registrado (%)"), { target: { value: progress } });
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: "Registrar avance" }));
}

describe("validateProgressDraft with unreadable numbers", () => {
  it("rejects a current value that is not a number and a progress that is not finite", () => {
    expect(validateProgressDraft({ currentValue: "abc", progressPercentage: "xyz" })).toEqual({
      currentValue: "El valor actual debe ser un número.",
      progressPercentage: "El avance debe estar entre 0 y 100 %.",
    });
  });
});

describe("KeyResultProgressForm failures and clearing", () => {
  beforeEach(() => { updateKeyResultProgress.mockReset(); });

  it("explains a generic conflict from the server in plain words", async () => {
    updateKeyResultProgress.mockRejectedValue(new ApiError("Error 409", 409));
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={vi.fn()} />);
    fill("80", "50");
    submitForm();
    expect(await screen.findByRole("alert")).toHaveTextContent("El KR no admite este registro de avance.");
  });

  it("keeps the server message when the error is not a generic status", async () => {
    updateKeyResultProgress.mockRejectedValue(new ApiError("Error 500", 500));
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={vi.fn()} />);
    fill("80", "50");
    submitForm();
    expect(await screen.findByRole("alert")).toHaveTextContent("Error 500");
  });

  it("shows the message of a plain error and a default for anything else", async () => {
    updateKeyResultProgress.mockRejectedValueOnce(new Error("Sin red"));
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={vi.fn()} />);
    fill("80", "50");
    submitForm();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin red");

    updateKeyResultProgress.mockRejectedValueOnce("falla");
    submitForm();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No se pudo registrar el avance del KR. Intenta de nuevo."));
  });

  it("clears the field messages and the server error once the user edits again", async () => {
    updateKeyResultProgress.mockRejectedValue(new Error("Sin red"));
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={vi.fn()} />);
    submitForm();
    expect(screen.getByText("Ingresa el valor actual medido para este KR.")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor actual (Porcentaje)")).toHaveAttribute("aria-invalid", "true");

    fill("80", "50");
    expect(screen.queryByText("Ingresa el valor actual medido para este KR.")).not.toBeInTheDocument();
    submitForm();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin red");
    fill("81", "50");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores a second submit while the first is still running", async () => {
    let finish: (value: KeyResult) => void = () => undefined;
    updateKeyResultProgress.mockReturnValue(new Promise<KeyResult>((resolve) => { finish = resolve; }));
    render(<KeyResultProgressForm keyResult={keyResult} onRecorded={vi.fn()} />);
    fill("80", "50");
    const form = screen.getByRole("form", { name: "Registrar avance del KR" });
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(updateKeyResultProgress).toHaveBeenCalledTimes(1);
    finish(keyResult);
    await waitFor(() => expect(screen.getByRole("button", { name: "Registrar avance" })).toBeEnabled());
  });
});
