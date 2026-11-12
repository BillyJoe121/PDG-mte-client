import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { ComparisonControlsBar } from "./PresentationComparisonControls";
import type { ComparisonType } from "./PresentationTypes";

const bets = [{ id: 1, name: "Apuesta uno" }, { id: 2, name: "Apuesta dos" }] as unknown as StrategicBet[];
const goals = [{ id: 5, name: "Meta cinco" }, { id: 6, name: "Meta seis" }] as unknown as Goal[];
const periods = [
  { id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" },
  { id: 2, name: "2025-2", status: undefined, startDate: null, endDate: null },
] as unknown as AcademicPeriod[];

function setup(compType: ComparisonType, extra: Partial<React.ComponentProps<typeof ComparisonControlsBar>> = {}) {
  const handlers = {
    setSelectedPeriodA: vi.fn(),
    setSelectedPeriodB: vi.fn(),
    setSelectedBetAId: vi.fn(),
    setSelectedBetBId: vi.fn(),
    setSelectedGoalAId: vi.fn(),
    setSelectedGoalBId: vi.fn(),
    handleSwap: vi.fn(),
  };
  render(
    <ComparisonControlsBar
      compType={compType}
      availablePeriods={periods}
      bets={bets}
      goals={goals}
      selectedPeriodA="2026-1"
      selectedPeriodB="2025-2"
      selectedBetAId={1}
      selectedBetBId={2}
      selectedGoalAId={5}
      selectedGoalBId={6}
      {...handlers}
      {...extra}
    />,
  );
  return handlers;
}

const select = (id: string) => document.getElementById(id) as HTMLSelectElement;

describe("ComparisonControlsBar", () => {
  it("changes both periods, swaps them and describes missing dates and status", () => {
    const handlers = setup("period-vs-period");
    expect(screen.getByText("2026-01-01 a 2026-06-30 · Estado: ACTIVO")).toBeInTheDocument();
    expect(screen.getByText("Sin fecha a Sin fecha · Estado: Sin estado")).toBeInTheDocument();

    fireEvent.change(select("select-period-a"), { target: { value: "2025-2" } });
    fireEvent.change(select("select-period-b"), { target: { value: "2026-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Intercambiar periodos" }));
    expect(handlers.setSelectedPeriodA).toHaveBeenCalledWith("2025-2");
    expect(handlers.setSelectedPeriodB).toHaveBeenCalledWith("2026-1");
    expect(handlers.handleSwap).toHaveBeenCalledOnce();
  });

  it("shows no caption for a period that is not registered", () => {
    setup("period-vs-period", { selectedPeriodA: "1999-1", selectedPeriodB: "1999-2" });
    expect(screen.queryByText(/Estado:/)).not.toBeInTheDocument();
  });

  it("changes the bets of a bet-vs-bet comparison", () => {
    const handlers = setup("bet-vs-bet");
    fireEvent.change(select("select-entity-a"), { target: { value: "2" } });
    fireEvent.change(select("select-entity-b"), { target: { value: "1" } });
    expect(handlers.setSelectedBetAId).toHaveBeenCalledWith(2);
    expect(handlers.setSelectedBetBId).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: /ver detalle/i })).not.toBeInTheDocument();
  });

  it("changes the goals of a goal-vs-goal comparison", () => {
    const handlers = setup("goal-vs-goal");
    fireEvent.change(select("select-entity-a"), { target: { value: "6" } });
    fireEvent.change(select("select-entity-b"), { target: { value: "5" } });
    expect(handlers.setSelectedGoalAId).toHaveBeenCalledWith(6);
    expect(handlers.setSelectedGoalBId).toHaveBeenCalledWith(5);
  });

  it("mixes a bet on side A with a goal on side B and opens their details", () => {
    const openA = vi.fn();
    const openB = vi.fn();
    const handlers = setup("bet-vs-goal", {
      detailA: { name: "Apuesta uno", open: openA },
      detailB: { name: "Meta cinco", open: openB },
    });
    fireEvent.change(select("select-entity-a"), { target: { value: "2" } });
    fireEvent.change(select("select-entity-b"), { target: { value: "6" } });
    expect(handlers.setSelectedBetAId).toHaveBeenCalledWith(2);
    expect(handlers.setSelectedGoalBId).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Apuesta uno" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Meta cinco" }));
    expect(openA).toHaveBeenCalledOnce();
    expect(openB).toHaveBeenCalledOnce();
    expect(screen.getByText("VS")).toBeInTheDocument();
  });
});
