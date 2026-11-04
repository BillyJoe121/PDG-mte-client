import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import { KeyResultTable } from "./KeyResultTable";

function keyResult(overrides: Partial<KeyResult> = {}): KeyResult {
  return {
    id: 7,
    name: "Aumentar matrícula",
    progressPercentage: 40,
    academicPeriodName: "2026-1",
    goals: [{ id: 1, name: "Crecimiento" }, { id: 2, name: "Alianzas" }],
    strategicBets: [],
    status: "ACTIVO",
    archived: false,
    ...overrides,
  } as KeyResult;
}

const handlers = () => ({ onOpen: vi.fn(), onRestore: vi.fn() });

describe("KeyResultTable", () => {
  it("shows the recorded data and every linked goal", () => {
    render(<KeyResultTable items={[keyResult()]} canRestore={false} restoringId={null} {...handlers()} />);

    expect(screen.getByText("KR-07")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Crecimiento, Alianzas")).toBeInTheDocument();
    expect(screen.getByText("Sin apuesta")).toBeInTheDocument();
  });

  it("opens the detail from the name and from the row action", () => {
    const actions = handlers();
    const item = keyResult();
    render(<KeyResultTable items={[item]} canRestore restoringId={null} {...actions} />);

    fireEvent.click(screen.getByRole("button", { name: "Aumentar matrícula" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Aumentar matrícula" }));

    expect(actions.onOpen).toHaveBeenCalledTimes(2);
    expect(actions.onOpen).toHaveBeenCalledWith(item);
    expect(screen.queryByRole("button", { name: /^Restaurar/ })).not.toBeInTheDocument();
  });

  it("offers restore on archived rows only to who can restore", () => {
    const actions = handlers();
    const item = keyResult({ archived: true });
    const { rerender } = render(<KeyResultTable items={[item]} canRestore restoringId={null} {...actions} />);

    fireEvent.click(screen.getByRole("button", { name: "Restaurar Aumentar matrícula" }));
    expect(actions.onRestore).toHaveBeenCalledWith(item);

    rerender(<KeyResultTable items={[item]} canRestore={false} restoringId={null} {...actions} />);
    expect(screen.queryByRole("button", { name: /^Restaurar/ })).not.toBeInTheDocument();
  });

  it("marks archived rows even for who cannot restore", () => {
    render(<KeyResultTable items={[keyResult({ archived: true })]} canRestore={false} restoringId={null} {...handlers()} />);

    expect(screen.getByText("Activo · Archivado")).toBeInTheDocument();
  });

  it("disables restore while that row is being restored", () => {
    const item = keyResult({ archived: true });
    render(<KeyResultTable items={[item]} canRestore restoringId={item.id} {...handlers()} />);

    expect(screen.getByRole("button", { name: "Restaurar Aumentar matrícula" })).toBeDisabled();
  });
});
