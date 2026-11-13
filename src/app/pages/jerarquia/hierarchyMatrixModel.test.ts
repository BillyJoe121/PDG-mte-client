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

const NO_SEARCH = { indicator: "", initiative: "" };

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

  it("orders columns by their code: O goals before P goals, bets by number, uncoded names last", () => {
    const matrix = buildHierarchyMatrix([
      node("GOAL", "1", "P2 · Saber Pro"),
      node("GOAL", "2", "O10 · Décima"),
      node("GOAL", "3", "Sin código"),
      node("GOAL", "4", "P1 · Crecimiento"),
      node("GOAL", "5", "O2 · Producción"),
      node("GOAL", "6", "Antes sin código"),
      node("GOAL", "7", "O1 · Alianzas"),
      node("STRATEGIC_BET", "1", "A3 · Vincular"),
      node("STRATEGIC_BET", "2", "A1 · Atraer"),
      node("STRATEGIC_BET", "3", "A2 · Experiencias"),
    ]);
    const { goals, bets } = visibleMatrixColumns(matrix, "arbol");

    expect(goals.map((column) => column.label)).toEqual([
      "O1 · Alianzas", "O2 · Producción", "O10 · Décima", "P1 · Crecimiento", "P2 · Saber Pro", "Antes sin código", "Sin código",
    ]);
    expect(bets.map((column) => column.label)).toEqual(["A1 · Atraer", "A2 · Experiencias", "A3 · Vincular"]);
  });

  it("drops rows without a link to the visible columns", () => {
    const matrix = buildHierarchyMatrix(tree);

    expect(filterMatrixRows(matrix.rows, matrix.bets, null, NO_SEARCH).map((row) => row.node.id)).toEqual(["1"]);
  });

  it("filters rows by the chosen column", () => {
    const matrix = buildHierarchyMatrix(tree);
    const columns = [...matrix.goals, ...matrix.bets];

    expect(filterMatrixRows(matrix.rows, columns, "STRATEGIC_BET:1", NO_SEARCH).map((row) => row.node.id)).toEqual(["1"]);
    expect(filterMatrixRows(matrix.rows, columns, "STRATEGIC_BET:2", NO_SEARCH)).toEqual([]);
  });

  it("filters rows by the key result code or name in the indicator search", () => {
    const matrix = buildHierarchyMatrix(tree);
    const columns = [...matrix.goals, ...matrix.bets];

    expect(filterMatrixRows(matrix.rows, columns, null, { indicator: "matricula", initiative: "" }).map((row) => row.node.id)).toEqual(["1"]);
    expect(filterMatrixRows(matrix.rows, columns, null, { indicator: "kr-02", initiative: "" }).map((row) => row.node.id)).toEqual(["2"]);
    expect(filterMatrixRows(matrix.rows, columns, null, { indicator: "matricula", initiative: "" })[0].initiatives).toHaveLength(2);
  });

  it("keeps only the matching initiatives and drops rows without any", () => {
    const matrix = buildHierarchyMatrix(tree);
    const columns = [...matrix.goals, ...matrix.bets];
    const rows = filterMatrixRows(matrix.rows, columns, null, { indicator: "", initiative: "ferias" });

    expect(rows.map((row) => row.node.id)).toEqual(["1"]);
    expect(rows[0].initiatives.map((item) => item.label)).toEqual(["Ferias"]);
    expect(filterMatrixRows(matrix.rows, columns, null, { indicator: "", initiative: "proy-10" })[0].initiatives.map((item) => item.id)).toEqual(["10"]);
  });

  it("combines both searches", () => {
    const matrix = buildHierarchyMatrix(tree);
    const columns = [...matrix.goals, ...matrix.bets];

    expect(filterMatrixRows(matrix.rows, columns, null, { indicator: "saber", initiative: "ferias" })).toEqual([]);
  });
});
