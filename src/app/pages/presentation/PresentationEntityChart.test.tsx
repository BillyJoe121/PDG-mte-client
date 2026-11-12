import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { StrategicBet } from "../../services/strategicApi";
import { ENTITY_SERIES, EntityCountsChart } from "./PresentationEntityChart";

const bet = (id: number, name: string, withSummary = true) =>
  ({
    id,
    name,
    executionSummary: withSummary
      ? { completedKeyResults: id, inProgressKeyResults: 1, completedProjects: 2, inProgressProjects: 1 }
      : undefined,
  }) as unknown as StrategicBet;

describe("EntityCountsChart", () => {
  it("lists one row per entity in API order and opens the detail of the clicked one", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const items = [bet(2, "Segunda"), bet(1, "Primera", false)];
    render(<EntityCountsChart items={items} onSelect={onSelect} itemLabel="Apuesta" />);

    expect(screen.getByRole("list", { name: "Conteos registrados por apuesta" })).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Detalle de Segunda", "Detalle de Primera"]);
    expect(ENTITY_SERIES).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Detalle de Primera" }));
    expect(onSelect).toHaveBeenCalledWith(items[1]);
  });

  it("renders without entities", () => {
    render(<EntityCountsChart items={[]} onSelect={vi.fn()} itemLabel="Meta" />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
