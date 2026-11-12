import { describe, expect, it } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import {
  countNodes,
  findHierarchyNodeKey,
  getContainedMetrics,
  getHierarchySectionLabel,
  getNodeIcon,
  getNodeSearchText,
  getRootAccent,
  getRootKeyFromNodeKey,
  getRootTypeLabel,
  getTreeNodeKey,
  groupHierarchyNodes,
  isHierarchyRootType,
  matchesHierarchySearch,
  matchesRootFilter,
  normalizeSearchText,
  truncateRootDescription,
} from "./hierarchyPageModel";

type Node = StrategicHierarchyNode;

function n(nodeType: Node["nodeType"], id: string, children: Node[] = [], extra: Partial<Node> = {}): Node {
  return { nodeType, id, label: `${nodeType}-${id}`, children, ...extra };
}

const tree: Node[] = [
  n("STRATEGIC_BET", "1", [
    n("GOAL", "2", [n("KEY_RESULT", "3", [n("PROJECT", "4"), n("PROJECT", "5")])]),
  ], { description: "Línea Estratégica", badge: "Activa" }),
  n("GOAL", "6"),
];

describe("hierarchy tree helpers", () => {
  it("counts nodes of a type recursively", () => {
    expect(countNodes(tree, "PROJECT")).toBe(2);
    expect(countNodes(tree, "GOAL")).toBe(2);
    expect(countNodes([], "GOAL")).toBe(0);
  });

  it("builds composite keys and extracts the root", () => {
    const key = getTreeNodeKey(tree[0]);
    expect(key).toBe("STRATEGIC_BET:1");
    expect(getTreeNodeKey(tree[1], key)).toBe("STRATEGIC_BET:1/GOAL:6");
    expect(getRootKeyFromNodeKey("STRATEGIC_BET:1/GOAL:2")).toBe("STRATEGIC_BET:1");
    expect(getRootKeyFromNodeKey("")).toBeNull();
  });

  it("recognises root node types", () => {
    expect(isHierarchyRootType("GOAL")).toBe(true);
    expect(isHierarchyRootType("STRATEGIC_BET")).toBe(true);
    expect(isHierarchyRootType("PROJECT")).toBe(false);
    expect(isHierarchyRootType(null)).toBe(false);
  });

  it("finds a nested node key or returns null", () => {
    expect(findHierarchyNodeKey(tree, "PROJECT", "5")).toBe("STRATEGIC_BET:1/GOAL:2/KEY_RESULT:3/PROJECT:5");
    expect(findHierarchyNodeKey(tree, "GOAL", "6")).toBe("GOAL:6");
    expect(findHierarchyNodeKey(tree, "PROJECT", "99")).toBeNull();
  });

  it("derives labels, accents and contained metrics for roots", () => {
    expect(getRootTypeLabel(tree[0])).toBe("Apuesta estrategica");
    expect(getRootAccent(tree[1])).toBeTruthy();
    expect(getContainedMetrics(tree[0])).toEqual({ krs: 1, projects: 2 });
    expect(getContainedMetrics({ ...tree[1], children: undefined as unknown as Node[] })).toEqual({ krs: 0, projects: 0 });
  });

  it("truncates long descriptions and collapses whitespace", () => {
    expect(truncateRootDescription("  hola   mundo  ")).toBe("hola mundo");
    const long = truncateRootDescription("a".repeat(300));
    expect(long.endsWith("...")).toBe(true);
    expect(long.length).toBe(135);
  });

  it("normalises accents and case for search", () => {
    expect(normalizeSearchText("Línea ÉXITO")).toBe("linea exito");
  });

  it("searches own and descendant text, ignoring accents", () => {
    expect(getNodeSearchText(tree[0])).toContain("Activa");
    expect(matchesHierarchySearch(tree[0], "linea estrategica")).toBe(true);
    expect(matchesHierarchySearch(tree[0], "PROJECT-5")).toBe(true);
    expect(matchesHierarchySearch(tree[0], "nada")).toBe(false);
    expect(matchesHierarchySearch(tree[0], "   ")).toBe(true);
    const withProgress = n("KEY_RESULT", "9", [], { progressPercentage: 45, executionSummary: { summaryText: "Resumen X" } as Node["executionSummary"] });
    expect(matchesHierarchySearch(withProgress, "45%")).toBe(true);
    expect(matchesHierarchySearch(withProgress, "resumen x")).toBe(true);
    expect(getNodeSearchText({ ...withProgress, children: undefined as unknown as Node[] })).toContain("45%");
  });

  it("filters roots by view", () => {
    expect(matchesRootFilter(tree[0], "arbol")).toBe(true);
    expect(matchesRootFilter(tree[0], "apuestas")).toBe(true);
    expect(matchesRootFilter(tree[1], "apuestas")).toBe(false);
    expect(matchesRootFilter(tree[1], "metas")).toBe(true);
    expect(matchesRootFilter(tree[0], "metas")).toBe(false);
  });

  it("groups nodes by type preserving first-seen order", () => {
    const groups = groupHierarchyNodes([n("GOAL", "1"), n("STRATEGIC_BET", "2"), n("GOAL", "3")]);
    expect(groups.map((group) => [group.type, group.nodes.length])).toEqual([["GOAL", 2], ["STRATEGIC_BET", 1]]);
  });

  it("maps types to section labels and icons", () => {
    expect(getHierarchySectionLabel("STRATEGIC_BET")).toBe("Apuestas");
    expect(getHierarchySectionLabel("GOAL")).toBe("Metas");
    expect(getHierarchySectionLabel("KEY_RESULT")).toBe("KRs");
    expect(getHierarchySectionLabel("PROJECT")).toBe("Iniciativas");
    for (const type of ["STRATEGIC_BET", "GOAL", "KEY_RESULT", "PROJECT"] as const) {
      expect(getNodeIcon(type)).toBeTruthy();
    }
  });

  it("walks payloads that omit the children list", () => {
    const sparse = [{ nodeType: "GOAL", id: "1", label: "Meta" }, { nodeType: "GOAL", id: "2", label: "Otra" }] as unknown as Node[];
    expect(countNodes(sparse, "GOAL")).toBe(2);
    expect(findHierarchyNodeKey(sparse, "GOAL", "2")).toBe("GOAL:2");
    expect(findHierarchyNodeKey(sparse, "GOAL", "9")).toBeNull();
  });
});
