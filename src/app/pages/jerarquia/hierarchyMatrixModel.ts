import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { normalizeSearchText, type View } from "./hierarchyPageModel";

export interface MatrixColumn {
  key: string;
  label: string;
  node: StrategicHierarchyNode;
}

export interface MatrixRow {
  node: StrategicHierarchyNode;
  columnKeys: Set<string>;
  initiatives: StrategicHierarchyNode[];
}

export interface HierarchyMatrixData {
  goals: MatrixColumn[];
  bets: MatrixColumn[];
  rows: MatrixRow[];
}

/** Goals and bets repeat the same key results, so each one is merged into a single row. */
export function buildHierarchyMatrix(tree: StrategicHierarchyNode[]): HierarchyMatrixData {
  const goals: MatrixColumn[] = [];
  const bets: MatrixColumn[] = [];
  const rows = new Map<string, MatrixRow>();

  for (const root of tree) {
    if (root.nodeType !== "GOAL" && root.nodeType !== "STRATEGIC_BET") continue;
    const column = { key: `${root.nodeType}:${root.id}`, label: root.label, node: root };
    (root.nodeType === "GOAL" ? goals : bets).push(column);

    for (const keyResult of root.children) {
      if (keyResult.nodeType !== "KEY_RESULT") continue;
      const row = rows.get(keyResult.id) ?? { node: keyResult, columnKeys: new Set<string>(), initiatives: [] };
      row.columnKeys.add(column.key);
      for (const child of keyResult.children) {
        if (child.nodeType === "PROJECT" && !row.initiatives.some((item) => item.id === child.id)) {
          row.initiatives.push(child);
        }
      }
      rows.set(keyResult.id, row);
    }
  }

  const sortedRows = [...rows.values()].sort((a, b) => Number(a.node.id) - Number(b.node.id));
  return { goals, bets, rows: sortedRows };
}

export function visibleMatrixColumns({ goals, bets }: HierarchyMatrixData, view: View) {
  return { goals: view === "apuestas" ? [] : goals, bets: view === "metas" ? [] : bets };
}

function matchesText(values: Array<string | null | undefined>, query: string) {
  return normalizeSearchText(values.filter(Boolean).join(" ")).includes(query);
}

/**
 * Keeps the rows linked to the visible columns (or to the chosen one). A search that hits the key
 * result or a linked goal or bet keeps every initiative; one that hits an initiative keeps only those.
 */
export function filterMatrixRows(rows: MatrixRow[], columns: MatrixColumn[], columnKey: string | null, search: string) {
  const query = normalizeSearchText(search.trim());
  const columnLabels = new Map(columns.map((column) => [column.key, column.label]));

  return rows.flatMap((row) => {
    const links = [...row.columnKeys].filter((key) => columnLabels.has(key));
    if (links.length === 0 || (columnKey && !row.columnKeys.has(columnKey))) return [];
    if (!query) return [row];

    const rowText = [row.node.label, row.node.description, ...links.map((key) => columnLabels.get(key))];
    if (matchesText(rowText, query)) return [row];

    const initiatives = row.initiatives.filter((item) => matchesText([item.label, item.description], query));
    return initiatives.length ? [{ ...row, initiatives }] : [];
  });
}
