import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeBet, makeGoal } from "../../../test/presentationFixtures";
import { PresentationGeneralReport } from "./PresentationGeneralReport";

const bets = [makeBet(1, "Apuesta uno")];
const goals = [
  makeGoal(1, "Meta uno"),
  makeGoal(2, "Meta sin indicador", { referenceIndicator: "", description: "", expectedValue: null, measurementUnitName: null }),
];

function renderReport(props: Partial<Parameters<typeof PresentationGeneralReport>[0]> = {}) {
  const onSelectBet = vi.fn();
  const onSelectGoal = vi.fn();
  const view = render(
    <PresentationGeneralReport bets={bets} goals={goals} periodName="2026-1" onSelectBet={onSelectBet} onSelectGoal={onSelectGoal} {...props} />
  );
  return { ...view, onSelectBet, onSelectGoal };
}

describe("PresentationGeneralReport", () => {
  it("shows both sections and lets the user filter them", () => {
    renderReport();
    expect(screen.getByText("Apuestas Estratégicas del periodo")).toBeInTheDocument();
    expect(screen.getByText("Metas Institucionales del periodo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Metas \(2\)/ }));
    expect(screen.queryByText("Apuestas Estratégicas del periodo")).not.toBeInTheDocument();
    expect(screen.getByText("Metas Institucionales del periodo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Apuestas \(1\)/ }));
    expect(screen.getByText("Apuestas Estratégicas del periodo")).toBeInTheDocument();
    expect(screen.queryByText("Metas Institucionales del periodo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todo" }));
    expect(screen.getByText("Metas Institucionales del periodo")).toBeInTheDocument();
  });

  it("selects a bet or a goal from its row", () => {
    const { onSelectBet, onSelectGoal } = renderReport();
    fireEvent.click(screen.getAllByText("Apuesta uno")[0]);
    expect(onSelectBet).toHaveBeenCalledWith(bets[0]);
    fireEvent.click(screen.getAllByText("Meta uno")[0]);
    expect(onSelectGoal).toHaveBeenCalledWith(goals[0]);
  });

  it("shows a fallback for a bet without description", () => {
    renderReport({ bets: [makeBet(5, "Apuesta muda", { description: "" })], goals: [] });
    expect(screen.getAllByText("Sin descripción registrada.").length).toBeGreaterThan(0);
  });

  it("describes goals using the indicator or a fallback", () => {
    renderReport();
    expect(screen.getAllByText("Indicador: Indicador").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sin descripción registrada.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sin registro").length).toBeGreaterThan(0);
  });

  it("uses the goal description when there is no indicator", () => {
    renderReport({ bets: [], goals: [makeGoal(3, "Meta descrita", { referenceIndicator: "", description: "Texto propio" })] });
    expect(screen.getAllByText("Texto propio").length).toBeGreaterThan(0);
  });

  it("shows an empty state for the side that has no records", () => {
    const { unmount } = renderReport({ bets: [] });
    expect(screen.getByText("No hay apuestas estratégicas registradas en este periodo")).toBeInTheDocument();
    unmount();
    renderReport({ goals: [] });
    expect(screen.getByText("No hay metas institucionales registradas en este periodo")).toBeInTheDocument();
  });

  it("shows a single empty state without tabs when nothing is recorded", () => {
    renderReport({ bets: [], goals: [] });
    expect(screen.getByText("No hay apuestas ni metas registradas para este periodo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Todo" })).not.toBeInTheDocument();
  });
});
