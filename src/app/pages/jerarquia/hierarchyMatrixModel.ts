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

const CODE_PATTERN = /^([A-Za-z]+)(\d+)\b/;

/** Code at the start of a goal or bet name, e.g. "O1 · Alianzas" gives O and 1. */
export function strategyCode(label: string) {
  const match = CODE_PATTERN.exec(label.trim());
  return match ? { letter: match[1].toUpperCase(), number: Number(match[2]) } : null;
}

/** By code letter (O before P), then number (A2 before A10); names without a code go last, by name. */
function byCode(a: MatrixColumn, b: MatrixColumn) {
  const codeA = strategyCode(a.label);
  const codeB = strategyCode(b.label);
  if (codeA && codeB) return codeA.letter.localeCompare(codeB.letter) || codeA.number - codeB.number;
  if (codeA || codeB) return codeA ? -1 : 1;
  return a.label.localeCompare(b.label, "es");
}

/** Goals and bets read left to right in code order: O1, O2… then P1…; A1, A2… */
export function visibleMatrixColumns({ goals, bets }: HierarchyMatrixData, view: View) {
  return {
    goals: view === "apuestas" ? [] : [...goals].sort(byCode),
    bets: view === "metas" ? [] : [...bets].sort(byCode),
  };
}

function matchesText(values: Array<string | null | undefined>, query: string) {
  return normalizeSearchText(values.filter(Boolean).join(" ")).includes(query);
}

export const keyResultCode = (node: StrategicHierarchyNode) => `KR-${node.id.padStart(2, "0")}`;
export const initiativeCode = (node: StrategicHierarchyNode) => `PROY-${node.id.padStart(2, "0")}`;

export interface MatrixSearch {
  /** Text sought in the key result: its code, name or description. */
  indicator: string;
  /** Text sought in the initiatives; only the matching ones stay in each row. */
  initiative: string;
}

/**
 * Keeps the rows linked to the visible columns (or to the chosen one), then applies the indicator
 * search to the key result and the initiative search to its initiatives. A row whose initiatives
 * all miss the initiative search is dropped.
 */
export function filterMatrixRows(rows: MatrixRow[], columns: MatrixColumn[], columnKey: string | null, search: MatrixSearch) {
  const visibleKeys = new Set(columns.map((column) => column.key));
  const indicatorQuery = normalizeSearchText(search.indicator.trim());
  const initiativeQuery = normalizeSearchText(search.initiative.trim());

  return rows.flatMap((row) => {
    if (![...row.columnKeys].some((key) => visibleKeys.has(key))) return [];
    if (columnKey && !row.columnKeys.has(columnKey)) return [];
    if (indicatorQuery && !matchesText([keyResultCode(row.node), row.node.label, row.node.description], indicatorQuery)) return [];
    if (!initiativeQuery) return [row];

    const initiatives = row.initiatives.filter((item) => matchesText([initiativeCode(item), item.label, item.description], initiativeQuery));
    return initiatives.length ? [{ ...row, initiatives }] : [];
  });
}
