import { describe, expect, it } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import type { MatrixColumn } from "./hierarchyMatrixModel";
import { buildConnectors, labelBandHeight } from "./HierarchyMatrixHeader";

function column(key: string): MatrixColumn {
  return { key, label: key, node: { id: key } as StrategicHierarchyNode };
}

const goals = [column("g1"), column("g2"), column("g3")];
const bets = [column("b1"), column("b2")];
const layout = {
  width: 1000,
  centerLeft: 120,
  centerRight: 920,
  centers: new Map([["g1", 20], ["g2", 60], ["g3", 100], ["b1", 940], ["b2", 980]]),
};

describe("buildConnectors", () => {
  const height = labelBandHeight(goals.length, bets.length);
  const connectors = buildConnectors(goals, bets, layout, height);
  const byKey = new Map(connectors.map((item) => [item.column.key, item]));

  it("gives the outermost column of each group the top row", () => {
    expect(byKey.get("g1")!.labelY).toBeLessThan(byKey.get("g2")!.labelY);
    expect(byKey.get("g2")!.labelY).toBeLessThan(byKey.get("g3")!.labelY);
    expect(byKey.get("b2")!.labelY).toBeLessThan(byKey.get("b1")!.labelY);
  });

  it("places goal labels to the right and bet labels to the left of their columns", () => {
    for (const key of ["g1", "g2", "g3"]) expect(byKey.get(key)!.labelX).toBeGreaterThan(layout.centers.get(key)!);
    for (const key of ["b1", "b2"]) expect(byKey.get(key)!.labelX).toBeLessThan(layout.centers.get(key)!);
  });

  it("keeps each label clear of the lines of the columns below it", () => {
    // A lower goal row starts further right than where the upper column's line passes at that height.
    expect(byKey.get("g2")!.labelX).toBeGreaterThan(byKey.get("g1")!.labelX);
    expect(byKey.get("g3")!.labelX).toBeGreaterThan(byKey.get("g2")!.labelX);
  });

  it("lets each group use up to the middle of the center area", () => {
    const middle = (layout.centerLeft + layout.centerRight) / 2;
    const goal = byKey.get("g1")!;
    const bet = byKey.get("b2")!;
    expect(goal.labelX + goal.maxWidth).toBeLessThanOrEqual(middle);
    expect(bet.labelX - bet.maxWidth).toBeGreaterThanOrEqual(middle);
  });

  it("skips columns that have not been measured yet", () => {
    expect(buildConnectors(goals, bets, { ...layout, centers: new Map() }, height)).toEqual([]);
  });
});
