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
  it("uses a distinct semantic color for every node type", () => {
    const colors = Object.values(hierarchyNodeTheme).map((theme) => theme.background);
    expect(new Set(colors).size).toBe(5);
  });

  it("counts duplicated nodes only once per type", () => {
    const summary = summarizeHierarchy(tree);
    expect(summary.find((item) => item.type === "OBJECTIVE")?.count).toBe(1);
  });

  it("labels a goal badge as indicator and target, not status", () => {
    expect(getNodeBadgeLabel("GOAL")).toBe("Indicador y meta");
  });
});
