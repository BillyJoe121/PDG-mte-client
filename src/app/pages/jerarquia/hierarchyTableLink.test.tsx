import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { hierarchyTableUrl, readHierarchyTableFocus } from "./hierarchyTableLink";
import { StrategyJumpButtons } from "./StrategyJumpButtons";

function paramsOf(url: string) {
  return new URL(url, "http://local").searchParams;
}

describe("hierarchyTableUrl", () => {
  it("round-trips a key result focus into the indicator search", () => {
    const url = hierarchyTableUrl({ rootType: "GOAL", rootId: 3, field: "indicator", text: "Elevar permanencia" });
    expect(url.startsWith("/jerarquia?")).toBe(true);
    expect(readHierarchyTableFocus(paramsOf(url))).toEqual({ columnKey: "GOAL:3", search: { indicator: "Elevar permanencia", initiative: "" } });
  });

  it("round-trips an initiative focus into the initiative search", () => {
    const url = hierarchyTableUrl({ rootType: "STRATEGIC_BET", rootId: 2, field: "initiative", text: "Lab & co" });
    expect(readHierarchyTableFocus(paramsOf(url))).toEqual({ columnKey: "STRATEGIC_BET:2", search: { indicator: "", initiative: "Lab & co" } });
  });

  it("ignores addresses that do not ask for the table and invalid columns", () => {
    expect(readHierarchyTableFocus(new URLSearchParams("rootType=GOAL&rootId=3"))).toBeNull();
    expect(readHierarchyTableFocus(new URLSearchParams("vista=tabla&columna=OTRO:1"))?.columnKey).toBeNull();
  });
});

describe("StrategyJumpButtons", () => {
  it("colors linked targets and opens them", async () => {
    const onOpen = vi.fn();
    render(<StrategyJumpButtons goal={{ id: 3, name: "Meta" }} bet={{ id: 2, name: "Apuesta" }} onOpen={onOpen} />);

    expect(screen.getByRole("button", { name: "Ver en Meta" })).toHaveClass("bg-[#4CB979]");
    expect(screen.getByRole("button", { name: "Ver en Apuesta" })).toHaveClass("bg-[#5454E9]");
    await userEvent.click(screen.getByRole("button", { name: "Ver en Apuesta" }));
    expect(onOpen).toHaveBeenCalledWith("STRATEGIC_BET", { id: 2, name: "Apuesta" });
  });

  it("grays out and disables targets without a link", () => {
    render(<StrategyJumpButtons onOpen={vi.fn()} />);

    const goal = screen.getByRole("button", { name: "Ver en Meta: sin meta vinculada" });
    expect(goal).toBeDisabled();
    expect(goal).toHaveClass("bg-[#E5E7EB]");
    expect(screen.getByRole("button", { name: "Ver en Apuesta: sin apuesta vinculada" })).toBeDisabled();
  });
});
