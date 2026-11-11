import type { MatrixSearch } from "./hierarchyMatrixModel";

export type HierarchyRootKind = "GOAL" | "STRATEGIC_BET";

/** What a detail asks the hierarchy table to show: one goal or bet column and the name typed in one search. */
export interface HierarchyTableFocus {
  rootType: HierarchyRootKind;
  rootId: number;
  /** Search box that receives the name: the key result one or the initiative one. */
  field: keyof MatrixSearch;
  text: string;
}

export interface HierarchyMatrixFocus {
  columnKey: string | null;
  search: MatrixSearch;
}

const VIEW_PARAM = "vista";
const COLUMN_PARAM = "columna";
const SEARCH_PARAMS: Record<keyof MatrixSearch, string> = { indicator: "indicador", initiative: "iniciativa" };

/** Address of the hierarchy table filtered by the goal or bet and searching the given name. */
export function hierarchyTableUrl(focus: HierarchyTableFocus) {
  const params = new URLSearchParams();
  params.set(VIEW_PARAM, "tabla");
  params.set(COLUMN_PARAM, `${focus.rootType}:${focus.rootId}`);
  params.set(SEARCH_PARAMS[focus.field], focus.text);
  return `/jerarquia?${params.toString()}`;
}

/** Reads a table focus from the address; null when the address does not ask for the table. */
export function readHierarchyTableFocus(params: URLSearchParams): HierarchyMatrixFocus | null {
  if (params.get(VIEW_PARAM) !== "tabla") return null;
  const column = params.get(COLUMN_PARAM);
  return {
    columnKey: column && /^(GOAL|STRATEGIC_BET):\d+$/.test(column) ? column : null,
    search: {
      indicator: params.get(SEARCH_PARAMS.indicator) ?? "",
      initiative: params.get(SEARCH_PARAMS.initiative) ?? "",
    },
  };
}

/** Parameter names to drop once the focus has been applied. */
export const HIERARCHY_TABLE_PARAMS = [VIEW_PARAM, COLUMN_PARAM, ...Object.values(SEARCH_PARAMS)];
