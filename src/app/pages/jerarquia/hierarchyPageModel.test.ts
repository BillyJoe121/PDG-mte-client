import { describe, expect, it } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { recordedProgressText } from "./hierarchyPageModel";

function node(nodeType: StrategicHierarchyNode["nodeType"], progressPercentage: number | null): StrategicHierarchyNode {
  return { nodeType, id: "1", label: "Nodo", progressPercentage, children: [] };
}

describe("recorded progress in the hierarchy", () => {
  it("shows the recorded percentage of a key result", () => {
    expect(recordedProgressText(node("KEY_RESULT", 40))).toBe("40%");
    expect(recordedProgressText(node("KEY_RESULT", 0))).toBe("0%");
  });

  it("tolerates a key result without recorded progress", () => {
    expect(recordedProgressText(node("KEY_RESULT", null))).toBeNull();
  });

  it("never shows progress for goals, bets or initiatives", () => {
    expect(recordedProgressText(node("GOAL", 55))).toBeNull();
    expect(recordedProgressText(node("GOAL", null))).toBeNull();
    expect(recordedProgressText(node("STRATEGIC_BET", 70))).toBeNull();
    expect(recordedProgressText(node("PROJECT", 30))).toBeNull();
  });
});
