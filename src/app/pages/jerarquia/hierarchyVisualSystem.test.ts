import { describe, expect, it } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { getNodeBadgeLabel, hierarchyNodeTheme, summarizeHierarchy } from "./hierarchyVisualSystem";

const tree: StrategicHierarchyNode[] = [
  {
    nodeType: "STRATEGIC_BET",
    id: "1",
    label: "Apuesta",
    children: [{ nodeType: "OBJECTIVE", id: "8", label: "Objetivo", children: [] }],
  },
  {
    nodeType: "GOAL",
    id: "2",
    label: "Meta",
    children: [{ nodeType: "OBJECTIVE", id: "8", label: "Objetivo", children: [] }],
  },
];

describe("hierarchy visual system", () => {
  it("uses the approved colors for each node type (Objetivo, KR, Proyecto)", () => {
    expect(hierarchyNodeTheme.OBJECTIVE.background).toBe("#E9683B");
    expect(hierarchyNodeTheme.KEY_RESULT.background).toBe("#5454E9");
    expect(hierarchyNodeTheme.PROJECT.background).toBe("#4CB979");
    expect(hierarchyNodeTheme.GOAL.background).toBe("#4CB979");
    expect(hierarchyNodeTheme.STRATEGIC_BET.background).toBe("#4F46E5");
  });

  it("uses the approved green for institutional-goal cards", () => {
    expect(hierarchyNodeTheme.GOAL.background).toBe("#4CB979");
  });

  it("counts duplicated nodes only once per type", () => {
    const summary = summarizeHierarchy(tree);
    expect(summary.find((item) => item.type === "OBJECTIVE")?.count).toBe(1);
  });

  it("labels a goal badge as indicator and target, not status", () => {
    expect(getNodeBadgeLabel("GOAL")).toBe("Indicador y meta");
  });
});
