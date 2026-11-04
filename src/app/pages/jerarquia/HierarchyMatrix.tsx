import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { EmptyState } from "./HierarchyRootViews";
import { buildHierarchyMatrix, filterMatrixRows, visibleMatrixColumns, type MatrixColumn, type MatrixRow } from "./hierarchyMatrixModel";
import { COLORS, type View } from "./hierarchyPageModel";

const CELL_BORDER = "1px solid #E5E7EB";
const GROUP_HEADER = { fontSize: 10.5, fontWeight: 850, color: "#374151", padding: "6px 8px", borderBottom: CELL_BORDER } as const;

function ColumnHeader({ column, active, onToggle }: { column: MatrixColumn; active: boolean; onToggle: () => void }) {
  return (
    <th scope="col" style={{ width: 40, minWidth: 40, padding: 0, borderBottom: CELL_BORDER, borderRight: CELL_BORDER, verticalAlign: "bottom" }}>
      <button
        type="button"
        aria-pressed={active}
        aria-label={`Filtrar por ${column.label}`}
        title={column.label}
        onClick={onToggle}
        style={{
          display: "block",
          width: "100%",
          height: 176,
          padding: "8px 0",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          overflow: "hidden",
          textAlign: "left",
          lineHeight: "13px",
          fontSize: 10.5,
          fontWeight: 750,
          backgroundColor: active ? "#EEF2FF" : "transparent",
          color: active ? COLORS.blue : "#374151",
        }}
      >
        {column.label}
      </button>
    </th>
  );
}

function LinkCell({ row, column, rowSpan }: { row: MatrixRow; column: MatrixColumn; rowSpan: number }) {
  const linked = row.columnKeys.has(column.key);
  return (
    <td rowSpan={rowSpan} style={{ borderBottom: CELL_BORDER, borderRight: CELL_BORDER, textAlign: "center", fontWeight: 850, color: COLORS.navy }}>
      {linked && (
        <>
          <span aria-hidden="true">X</span>
          <span className="sr-only">Vinculado a {column.label}</span>
        </>
      )}
    </td>
  );
}

function InitiativeCell({ initiative, onOpen }: { initiative?: StrategicHierarchyNode; onOpen: (node: StrategicHierarchyNode) => void }) {
  return (
    <td style={{ minWidth: 240, padding: "7px 10px", borderBottom: CELL_BORDER, borderRight: CELL_BORDER }}>
      {initiative ? (
        <button type="button" onClick={() => onOpen(initiative)} className="text-left underline-offset-2 hover:underline" style={{ color: COLORS.text, overflowWrap: "anywhere" }}>
          <span style={{ fontWeight: 800, color: COLORS.gray }}>PROY-{initiative.id.padStart(2, "0")}</span> {initiative.label}
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
  search: string;
  onOpenNode: (node: StrategicHierarchyNode) => void;
  onOpenRoot: (node: StrategicHierarchyNode) => void;
}

export function HierarchyMatrix({ tree, view, search, onOpenNode, onOpenRoot }: HierarchyMatrixProps) {
  const [columnKey, setColumnKey] = useState<string | null>(null);
  const matrix = useMemo(() => buildHierarchyMatrix(tree), [tree]);
  const { goals, bets } = visibleMatrixColumns(matrix, view);
  const columns = [...goals, ...bets];
  const activeColumn = columns.find((column) => column.key === columnKey) ?? null;
  const rows = filterMatrixRows(matrix.rows, columns, activeColumn?.key ?? null, search);
  const initiativeCount = rows.reduce((total, row) => total + row.initiatives.length, 0);

  const renderHeader = (column: MatrixColumn) => (
    <ColumnHeader
      key={column.key}
      column={column}
      active={column.key === activeColumn?.key}
      onToggle={() => setColumnKey(column.key === activeColumn?.key ? null : column.key)}
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex min-h-[32px] flex-wrap items-center gap-2" style={{ fontSize: 11, color: "#374151" }}>
        <p role="status" style={{ fontWeight: 750 }}>{rows.length} KR · {initiativeCount} iniciativas</p>
        {activeColumn && (
          <>
            <span style={{ fontWeight: 800, color: COLORS.blue }}>Filtrando por: {activeColumn.label}</span>
            <button type="button" onClick={() => onOpenRoot(activeColumn.node)} className="inline-flex min-h-[32px] items-center rounded-md px-2.5" style={{ border: `1px solid ${COLORS.border}`, fontWeight: 800 }}>
              Ver detalle
            </button>
            <button type="button" onClick={() => setColumnKey(null)} className="inline-flex min-h-[32px] items-center gap-1 rounded-md px-2.5" style={{ border: `1px solid ${COLORS.border}`, fontWeight: 800 }}>
              <X size={12} aria-hidden="true" /> Quitar filtro
            </button>
          </>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState text="No hay KR que coincidan con los filtros." />
      ) : (
        <div
          role="region"
          aria-label="Matriz de Metas, KR, iniciativas y Apuestas"
          tabIndex={0}
          className="relative overflow-auto rounded-lg bg-white"
          style={{ border: `1px solid ${COLORS.border}`, maxHeight: "max(360px, calc(100dvh - 310px))" }}
        >
          <table style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: 11.5, width: "100%" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#F8F9FB" }}>
              <tr>
                {goals.length > 0 && <th scope="colgroup" colSpan={goals.length} style={{ ...GROUP_HEADER, borderRight: CELL_BORDER }}>Metas</th>}
                <th rowSpan={2} scope="col" style={{ ...GROUP_HEADER, minWidth: 58, verticalAlign: "bottom", textAlign: "left", borderRight: CELL_BORDER }}>KR</th>
                <th rowSpan={2} scope="col" style={{ ...GROUP_HEADER, minWidth: 220, verticalAlign: "bottom", textAlign: "left", borderRight: CELL_BORDER }}>Indicador</th>
                <th rowSpan={2} scope="col" style={{ ...GROUP_HEADER, verticalAlign: "bottom", textAlign: "left", borderRight: CELL_BORDER }}>Iniciativas</th>
                {bets.length > 0 && <th scope="colgroup" colSpan={bets.length} style={GROUP_HEADER}>Apuestas</th>}
              </tr>
              <tr>
                {goals.map(renderHeader)}
                {bets.map(renderHeader)}
              </tr>
            </thead>
            {rows.map((row) => {
              const rowSpan = Math.max(row.initiatives.length, 1);
              const [firstInitiative, ...otherInitiatives] = row.initiatives;
              return (
                <tbody key={row.node.id}>
                  <tr>
                    {goals.map((column) => <LinkCell key={column.key} row={row} column={column} rowSpan={rowSpan} />)}
                    <th rowSpan={rowSpan} scope="rowgroup" style={{ padding: "7px 10px", textAlign: "left", verticalAlign: "top", borderBottom: CELL_BORDER, borderRight: CELL_BORDER, fontWeight: 800, color: COLORS.gray, whiteSpace: "nowrap" }}>
                      KR-{row.node.id.padStart(2, "0")}
                    </th>
                    <td rowSpan={rowSpan} style={{ padding: "7px 10px", verticalAlign: "top", borderBottom: CELL_BORDER, borderRight: CELL_BORDER }}>
                      <button type="button" onClick={() => onOpenNode(row.node)} className="text-left underline-offset-2 hover:underline" style={{ fontWeight: 750, color: COLORS.text, overflowWrap: "anywhere" }}>
                        {row.node.label}
                      </button>
                    </td>
                    <InitiativeCell initiative={firstInitiative} onOpen={onOpenNode} />
                    {bets.map((column) => <LinkCell key={column.key} row={row} column={column} rowSpan={rowSpan} />)}
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
