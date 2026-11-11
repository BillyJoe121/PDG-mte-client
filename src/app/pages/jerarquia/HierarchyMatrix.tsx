import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { EmptyState } from "./HierarchyRootViews";
import { buildHierarchyMatrix, filterMatrixRows, initiativeCode, keyResultCode, visibleMatrixColumns, type MatrixColumn, type MatrixRow, type MatrixSearch } from "./hierarchyMatrixModel";
import { COLORS, type View } from "./hierarchyPageModel";
import type { HierarchyMatrixFocus } from "./hierarchyTableLink";
import { BET_COLOR, CELL_BORDER, GOAL_COLOR, MatrixHead } from "./HierarchyMatrixHeader";

function LinkCell({ row, column, rowSpan, color }: { row: MatrixRow; column: MatrixColumn; rowSpan: number; color: string }) {
  const linked = row.columnKeys.has(column.key);
  return (
    <td rowSpan={rowSpan} style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, textAlign: "center", verticalAlign: "middle" }}>
      {linked && (
        <>
          <span aria-hidden="true" className="inline-flex items-center justify-center rounded-full" style={{ width: 18, height: 18, backgroundColor: color, color: "#FFFFFF" }}>
            <Check size={11} strokeWidth={3.2} />
          </span>
          <span className="sr-only">Vinculado a {column.label}</span>
        </>
      )}
    </td>
  );
}

function InitiativeCell({ initiative, onOpen, tourId }: { initiative?: StrategicHierarchyNode; onOpen: (node: StrategicHierarchyNode) => void; tourId?: string }) {
  return (
    <td style={{ minWidth: 240, padding: "7px 10px", borderBottom: CELL_BORDER, borderRight: CELL_BORDER }}>
      {initiative ? (
        <button type="button" onClick={() => onOpen(initiative)} data-tour={tourId} className="text-left underline-offset-2 hover:underline" style={{ color: COLORS.text, overflowWrap: "anywhere" }}>
          <span style={{ fontWeight: 800, color: COLORS.gray }}>{initiativeCode(initiative)}</span> {initiative.label}
        </button>
      ) : (
        <span style={{ color: COLORS.gray }}>Sin iniciativas</span>
      )}
    </td>
  );
}

interface HierarchyMatrixProps {
  tree: StrategicHierarchyNode[];
  view: View;
  onOpenNode: (node: StrategicHierarchyNode) => void;
  onOpenRoot: (node: StrategicHierarchyNode) => void;
  /** Starting column filter and searches, e.g. when arriving from a key result or initiative detail. */
  initialFocus?: HierarchyMatrixFocus | null;
}

export function HierarchyMatrix({ tree, view, onOpenNode, onOpenRoot, initialFocus }: HierarchyMatrixProps) {
  const [columnKey, setColumnKey] = useState<string | null>(initialFocus?.columnKey ?? null);
  const [search, setSearch] = useState<MatrixSearch>(initialFocus?.search ?? { indicator: "", initiative: "" });
  const matrix = useMemo(() => buildHierarchyMatrix(tree), [tree]);
  const { goals, bets } = visibleMatrixColumns(matrix, view);
  const columns = [...goals, ...bets];
  const activeColumn = columns.find((column) => column.key === columnKey) ?? null;
  const rows = filterMatrixRows(matrix.rows, columns, activeColumn?.key ?? null, search);
  const searching = Boolean(search.indicator.trim() || search.initiative.trim());
  const totalColumns = columns.length + 3;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {activeColumn && (
        <div className="flex min-h-[32px] flex-shrink-0 flex-wrap items-center gap-2" style={{ fontSize: 11, color: "#374151" }}>
          <span style={{ fontWeight: 800, color: COLORS.blue }}>Filtrando por: {activeColumn.label}</span>
          <button type="button" onClick={() => onOpenRoot(activeColumn.node)} className="inline-flex min-h-[32px] items-center rounded-md px-2.5" style={{ border: `1px solid ${COLORS.border}`, fontWeight: 800 }}>
            Ver detalle
          </button>
          <button type="button" onClick={() => setColumnKey(null)} className="inline-flex min-h-[32px] items-center gap-1 rounded-md px-2.5" style={{ border: `1px solid ${COLORS.border}`, fontWeight: 800 }}>
            <X size={12} aria-hidden="true" /> Quitar filtro
          </button>
        </div>
      )}

      {rows.length === 0 && !searching ? (
        <EmptyState text="No hay KR que coincidan con los filtros." />
      ) : (
        <div
          role="region"
          aria-label="Matriz de Metas, KR, iniciativas y Apuestas"
          data-tour="jerarquia-table"
          tabIndex={0}
          className="relative min-h-0 overflow-auto rounded-lg bg-white"
          style={{ flex: "0 1 auto", border: `1px solid ${COLORS.border}` }}
        >
          <table style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: 11.5, width: "100%" }}>
            <MatrixHead
              goals={goals}
              bets={bets}
              activeKey={activeColumn?.key ?? null}
              onToggle={(column) => setColumnKey(column.key === activeColumn?.key ? null : column.key)}
              search={search}
              onSearchChange={setSearch}
            />
            {rows.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={totalColumns} style={{ padding: "28px 12px", textAlign: "center", color: COLORS.gray, fontWeight: 750 }}>
                    No hay KR ni iniciativas que coincidan con la búsqueda.
                  </td>
                </tr>
              </tbody>
            )}
            {rows.map((row, rowIndex) => {
              const rowSpan = Math.max(row.initiatives.length, 1);
              const [firstInitiative, ...otherInitiatives] = row.initiatives;
              return (
                <tbody key={row.node.id}>
                  <tr>
                    {goals.map((column) => <LinkCell key={column.key} row={row} column={column} rowSpan={rowSpan} color={GOAL_COLOR} />)}
                    <th rowSpan={rowSpan} scope="rowgroup" style={{ padding: "7px 10px", textAlign: "left", verticalAlign: "top", borderBottom: CELL_BORDER, borderRight: CELL_BORDER, fontWeight: 800, color: COLORS.gray, whiteSpace: "nowrap" }}>
                      {keyResultCode(row.node)}
                    </th>
                    <td rowSpan={rowSpan} style={{ padding: "7px 10px", verticalAlign: "top", borderBottom: CELL_BORDER, borderRight: CELL_BORDER }}>
                      <button type="button" onClick={() => onOpenNode(row.node)} data-tour={rowIndex === 0 ? "jerarquia-kr" : undefined} className="text-left underline-offset-2 hover:underline" style={{ fontWeight: 750, color: COLORS.text, overflowWrap: "anywhere" }}>
                        {row.node.label}
                      </button>
                    </td>
                    <InitiativeCell initiative={firstInitiative} onOpen={onOpenNode} tourId={rowIndex === 0 ? "jerarquia-initiative" : undefined} />
                    {bets.map((column) => <LinkCell key={column.key} row={row} column={column} rowSpan={rowSpan} color={BET_COLOR} />)}
                  </tr>
                  {otherInitiatives.map((initiative) => (
                    <tr key={initiative.id}>
                      <InitiativeCell initiative={initiative} onOpen={onOpenNode} />
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}
