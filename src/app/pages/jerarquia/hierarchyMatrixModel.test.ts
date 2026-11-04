import { describe, expect, it } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { buildHierarchyMatrix, filterMatrixRows, visibleMatrixColumns } from "./hierarchyMatrixModel";

function node(
  nodeType: StrategicHierarchyNode["nodeType"],
  id: string,
  label: string,
  children: StrategicHierarchyNode[] = [],
): StrategicHierarchyNode {
  return { nodeType, id, label, children };
}

const sharedKr = () => node("KEY_RESULT", "1", "Aumentar matrícula", [node("PROJECT", "10", "Plan de becas"), node("PROJECT", "11", "Ferias")]);
const tree = [
  node("STRATEGIC_BET", "1", "Atraer talento", [sharedKr()]),
  node("STRATEGIC_BET", "2", "Sin KR"),
  node("GOAL", "1", "Crecimiento", [sharedKr(), node("KEY_RESULT", "2", "Saber Pro")]),
];

describe("hierarchy matrix", () => {
  it("merges a key result repeated under a goal and a bet", () => {
    const matrix = buildHierarchyMatrix(tree);

    expect(matrix.rows.map((row) => row.node.id)).toEqual(["1", "2"]);
    expect([...matrix.rows[0].columnKeys]).toEqual(["STRATEGIC_BET:1", "GOAL:1"]);
    expect(matrix.rows[0].initiatives.map((item) => item.id)).toEqual(["10", "11"]);
  });

  it("orders rows by key result regardless of the root that lists them first", () => {
    const unordered = [node("GOAL", "1", "Crecimiento", [node("KEY_RESULT", "10", "Décimo"), node("KEY_RESULT", "2", "Segundo")])];

    expect(buildHierarchyMatrix(unordered).rows.map((row) => row.node.id)).toEqual(["2", "10"]);
  });

  it("keeps a key result without initiatives and a root without key results", () => {
    const matrix = buildHierarchyMatrix(tree);

    expect(matrix.rows[1].initiatives).toEqual([]);
    expect(matrix.bets.map((column) => column.label)).toEqual(["Atraer talento", "Sin KR"]);
    expect(matrix.goals.map((column) => column.label)).toEqual(["Crecimiento"]);
  });

  it("shows only the columns of the selected root filter", () => {
    const matrix = buildHierarchyMatrix(tree);

    expect(visibleMatrixColumns(matrix, "metas").bets).toEqual([]);
    expect(visibleMatrixColumns(matrix, "apuestas").goals).toEqual([]);
    expect(visibleMatrixColumns(matrix, "arbol").goals).toHaveLength(1);
  });

  it("drops rows without a link to the visible columns", () => {
    const matrix = buildHierarchyMatrix(tree);

    expect(filterMatrixRows(matrix.rows, matrix.bets, null, "").map((row) => row.node.id)).toEqual(["1"]);
  });

  it("filters rows by the chosen column", () => {
    const matrix = buildHierarchyMatrix(tree);
    const columns = [...matrix.goals, ...matrix.bets];

    expect(filterMatrixRows(matrix.rows, columns, "STRATEGIC_BET:1", "").map((row) => row.node.id)).toEqual(["1"]);
    expect(filterMatrixRows(matrix.rows, columns, "STRATEGIC_BET:2", "")).toEqual([]);
  });

  it("keeps every initiative when the search hits the key result or a linked column", () => {
    const matrix = buildHierarchyMatrix(tree);
    const columns = [...matrix.goals, ...matrix.bets];

    expect(filterMatrixRows(matrix.rows, columns, null, "matricula")[0].initiatives).toHaveLength(2);
    expect(filterMatrixRows(matrix.rows, columns, null, "atraer")[0].initiatives).toHaveLength(2);
  });

  it("keeps only the matching initiatives when the search hits one of them", () => {
    const matrix = buildHierarchyMatrix(tree);
    const columns = [...matrix.goals, ...matrix.bets];
    const [row] = filterMatrixRows(matrix.rows, columns, null, "ferias");

    expect(row.initiatives.map((item) => item.label)).toEqual(["Ferias"]);
  });

  it("does not match the text of a column hidden by the root filter", () => {
    const matrix = buildHierarchyMatrix(tree);

    expect(filterMatrixRows(matrix.rows, matrix.goals, null, "atraer")).toEqual([]);
  });
});
