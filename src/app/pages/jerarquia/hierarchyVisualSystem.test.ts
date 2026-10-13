import { describe, expect, it } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { getNodeBadgeLabel, hierarchyNodeLabel, hierarchyNodeTheme, summarizeHierarchy } from "./hierarchyVisualSystem";

const tree: StrategicHierarchyNode[] = [
  {
    nodeType: "STRATEGIC_BET",
    id: "1",
    label: "Apuesta",
    children: [{ nodeType: "KEY_RESULT", id: "8", label: "KR", children: [{ nodeType: "PROJECT", id: "3", label: "Iniciativa", children: [] }] }],
  },
  {
    nodeType: "GOAL",
    id: "2",
    label: "Meta",
    children: [{ nodeType: "KEY_RESULT", id: "8", label: "KR", children: [] }],
  },
];

describe("hierarchy visual system", () => {
  it("uses the approved colors for each node type (KR, Iniciativa)", () => {
    expect(hierarchyNodeTheme.KEY_RESULT.background).toBe("#5454E9");
    expect(hierarchyNodeTheme.PROJECT.background).toBe("#4CB979");
    expect(hierarchyNodeTheme.GOAL.background).toBe("#4CB979");
    expect(hierarchyNodeTheme.STRATEGIC_BET.background).toBe("#4F46E5");
  });

  it("uses the approved green for institutional-goal cards", () => {
    expect(hierarchyNodeTheme.GOAL.background).toBe("#4CB979");
  });

  it("counts duplicated nodes only once per type and has no objective level", () => {
    const summary = summarizeHierarchy(tree);
    expect(summary.map((item) => item.type)).toEqual(["STRATEGIC_BET", "GOAL", "KEY_RESULT", "PROJECT"]);
    expect(summary.find((item) => item.type === "KEY_RESULT")?.count).toBe(1);
    expect(summary.find((item) => item.type === "PROJECT")?.label).toBe("Iniciativa");
  });

  it("labels a goal badge as indicator and target, not status", () => {
    expect(getNodeBadgeLabel("GOAL")).toBe("Indicador y meta");
    expect(Object.keys(hierarchyNodeLabel)).not.toContain("OBJECTIVE");
  });
});
