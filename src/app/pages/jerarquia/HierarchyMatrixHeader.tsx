import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Compass, Search, Target, X } from "lucide-react";
import type { MatrixColumn, MatrixSearch } from "./hierarchyMatrixModel";
import { COLORS } from "./hierarchyPageModel";

export const CELL_BORDER = "1px solid #E5E7EB";
export const GOAL_COLOR = "#2F9E5E";
export const BET_COLOR = COLORS.blue;

const COLUMN_WIDTH = 40;
const ROW_HEIGHT = 20;
const TOP_PADDING = 26;
const STUB = 10;
const LABEL_GAP = 5;
const MIN_LABEL_WIDTH = 72;
const CENTER_HEADER = { fontSize: 10.5, fontWeight: 850, color: "#374151", padding: "6px 8px", textAlign: "left", verticalAlign: "bottom", borderBottom: CELL_BORDER, borderRight: CELL_BORDER } as const;

type Side = "goal" | "bet";

interface Layout {
  width: number;
  centerLeft: number;
  centerRight: number;
  centers: Map<string, number>;
}

interface Connector {
  column: MatrixColumn;
  side: Side;
  path: string;
  labelX: number;
  labelY: number;
  maxWidth: number;
}

/** Height of the label band: one row per column of the larger group, plus room for the group titles. */
export function labelBandHeight(goalCount: number, betCount: number) {
  return TOP_PADDING + Math.max(goalCount, betCount, 1) * ROW_HEIGHT + STUB + 4;
}

/**
 * Each column gets a horizontal label in its own row, joined to the column by a short stub and a
 * 45 degree line that leans toward the center. The outermost column takes the top row, so the lines
 * run parallel and never cross. Goals sit on the left and bets mirror them on the right.
 */
export function buildConnectors(goals: MatrixColumn[], bets: MatrixColumn[], layout: Layout, height: number): Connector[] {
  const middle = goals.length && bets.length ? (layout.centerLeft + layout.centerRight) / 2 : null;
  const goalLimit = (middle ?? layout.width) - 12;
  const betLimit = (middle ?? 0) + 12;
  const result: Connector[] = [];

  const place = (column: MatrixColumn, row: number, side: Side) => {
    const x = layout.centers.get(column.key);
    if (x === undefined) return;
    const y = TOP_PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2;
    const rise = height - STUB - y;
    const direction = side === "goal" ? 1 : -1;
    const endX = x + direction * rise;
    const tickX = endX + direction * LABEL_GAP;
    const labelX = tickX + direction * 2;
    const room = side === "goal" ? goalLimit - labelX : labelX - betLimit;
    result.push({
      column,
      side,
      path: `M ${x} ${height} L ${x} ${height - STUB} L ${endX} ${y} L ${tickX} ${y}`,
      labelX,
      labelY: y,
      maxWidth: Math.max(room, MIN_LABEL_WIDTH),
    });
  };

  goals.forEach((column, index) => place(column, index, "goal"));
  bets.forEach((column, index) => place(column, bets.length - 1 - index, "bet"));
  return result;
}

interface MatrixHeadProps {
  goals: MatrixColumn[];
  bets: MatrixColumn[];
  activeKey: string | null;
  /** Columns shown emphasized: the selected one, the hovered one and those linked to the hovered KR. */
  highlightKeys: ReadonlySet<string>;
  onHoverColumn: (key: string | null) => void;
  onToggle: (column: MatrixColumn) => void;
  search: MatrixSearch;
  onSearchChange: (search: MatrixSearch) => void;
}

export function MatrixHead({ goals, bets, activeKey, highlightKeys, onHoverColumn, onToggle, search, onSearchChange }: MatrixHeadProps) {
  const bandRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<string, HTMLElement>());
  const krRef = useRef<HTMLTableCellElement>(null);
  const initiativesRef = useRef<HTMLTableCellElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const height = labelBandHeight(goals.length, bets.length);
  const columnSignature = [...goals, ...bets].map((column) => column.key).join("|");

  const measure = useCallback(() => {
    const band = bandRef.current;
    if (!band || !krRef.current || !initiativesRef.current) return;
    const origin = band.getBoundingClientRect().left;
    const centers = new Map<string, number>();
    cellRefs.current.forEach((cell, key) => {
      const box = cell.getBoundingClientRect();
      centers.set(key, box.left - origin + box.width / 2);
    });
    setLayout({
      width: band.clientWidth,
      centerLeft: krRef.current.getBoundingClientRect().left - origin,
      centerRight: initiativesRef.current.getBoundingClientRect().right - origin,
      centers,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    if (bandRef.current) observer.observe(bandRef.current);
    if (krRef.current) observer.observe(krRef.current);
    if (initiativesRef.current) observer.observe(initiativesRef.current);
    cellRefs.current.forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [measure, columnSignature]);

  const connectors = layout ? buildConnectors(goals, bets, layout, height) : [];
  const totalColumns = goals.length + bets.length + 3;

  const columnCell = (column: MatrixColumn, side: Side) => {
    const active = column.key === activeKey;
    const emphasized = active || highlightKeys.has(column.key);
    const color = side === "goal" ? GOAL_COLOR : BET_COLOR;
    const Icon = side === "goal" ? Target : Compass;
    return (
      <th
        key={column.key}
        scope="col"
        ref={(cell) => {
          if (cell) cellRefs.current.set(column.key, cell);
          else cellRefs.current.delete(column.key);
        }}
        style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH, padding: 0, borderBottom: CELL_BORDER, borderRight: CELL_BORDER }}
      >
        <button
          type="button"
          aria-pressed={active}
          aria-label={`Filtrar por ${column.label}`}
          title={column.label}
          onClick={() => onToggle(column)}
          onMouseEnter={() => onHoverColumn(column.key)}
          onMouseLeave={() => onHoverColumn(null)}
          onFocus={() => onHoverColumn(column.key)}
          onBlur={() => onHoverColumn(null)}
          className="flex w-full items-center justify-center"
          style={{ height: 30, backgroundColor: emphasized ? `${color}1F` : "transparent", color }}
        >
          <Icon size={15} strokeWidth={emphasized ? 2.6 : 2} aria-hidden="true" />
        </button>
      </th>
    );
  };

  return (
    <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#F8F9FB" }}>
      <tr>
        <td colSpan={totalColumns} data-tour="jerarquia-filter" style={{ padding: 0, borderBottom: CELL_BORDER }}>
          <div ref={bandRef} aria-hidden="true" style={{ position: "relative", height, overflow: "hidden" }}>
            {goals.length > 0 && <GroupTitle text="Metas" color={GOAL_COLOR} align="left" />}
            {bets.length > 0 && <GroupTitle text="Apuestas" color={BET_COLOR} align="right" />}
            <svg width="100%" height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {connectors.map(({ column, side, path }) => {
                const emphasized = column.key === activeKey || highlightKeys.has(column.key);
                return (
                  <path
                    key={column.key}
                    d={path}
                    fill="none"
                    stroke={side === "goal" ? GOAL_COLOR : BET_COLOR}
                    strokeOpacity={emphasized ? 1 : 0.45}
                    strokeWidth={emphasized ? 2 : 1.25}
                    strokeLinejoin="round"
                  />
                );
              })}
            </svg>
            {connectors.map(({ column, side, labelX, labelY, maxWidth }) => {
              const active = column.key === activeKey;
              const emphasized = active || highlightKeys.has(column.key);
              const color = side === "goal" ? GOAL_COLOR : BET_COLOR;
              return (
                <button
                  key={column.key}
                  type="button"
                  tabIndex={-1}
                  title={column.label}
                  onClick={() => onToggle(column)}
                  onMouseEnter={() => onHoverColumn(column.key)}
                  onMouseLeave={() => onHoverColumn(null)}
                  style={{
                    position: "absolute",
                    top: labelY - 9,
                    height: 18,
                    maxWidth,
                    ...(side === "goal" ? { left: labelX } : { right: (layout?.width ?? 0) - labelX }),
                    padding: "0 6px",
                    borderRadius: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 11,
                    lineHeight: "18px",
                    fontWeight: active ? 850 : 700,
                    color: emphasized ? color : "#374151",
                    backgroundColor: active ? `${color}1F` : emphasized ? "#FFFFFF" : "transparent",
                  }}
                >
                  {column.label}
                </button>
              );
            })}
          </div>
        </td>
      </tr>
      <tr>
        {goals.map((column) => columnCell(column, "goal"))}
        <th ref={krRef} scope="col" style={{ ...CENTER_HEADER, minWidth: 58 }}>KR</th>
        <th scope="col" data-tour="jerarquia-search" style={{ ...CENTER_HEADER, minWidth: 220, padding: "4px 8px" }}>
          <ColumnSearch
            title="Indicador"
            value={search.indicator}
            onChange={(indicator) => onSearchChange({ ...search, indicator })}
            placeholder="Buscar KR o indicador"
          />
        </th>
        <th ref={initiativesRef} scope="col" style={{ ...CENTER_HEADER, minWidth: 240, padding: "4px 8px" }}>
          <ColumnSearch
            title="Iniciativas"
            value={search.initiative}
            onChange={(initiative) => onSearchChange({ ...search, initiative })}
            placeholder="Buscar iniciativa"
          />
        </th>
        {bets.map((column) => columnCell(column, "bet"))}
      </tr>
    </thead>
  );
}

function GroupTitle({ text, color, align }: { text: string; color: string; align: "left" | "right" }) {
  return (
    <span
      style={{
        position: "absolute",
        top: 7,
        [align]: 10,
        fontSize: 10,
        fontWeight: 850,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
      }}
    >
      {text}
    </span>
  );
}

function ColumnSearch({ title, value, onChange, placeholder }: { title: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ flexShrink: 0 }}>{title}</span>
      <label
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2"
        style={{ height: 26, border: `1px solid ${value ? COLORS.blue : COLORS.border}`, backgroundColor: "#FFFFFF" }}
      >
        <Search size={12} color={COLORS.gray} aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onChange("");
          }}
          placeholder={placeholder}
          aria-label={`Buscar en ${title}`}
          className="min-w-0 flex-1 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden"
          style={{ border: 0, fontSize: 10.5, fontWeight: 650, color: COLORS.text }}
        />
        {value && (
          <button type="button" onClick={() => onChange("")} aria-label={`Limpiar búsqueda en ${title}`} className="flex items-center" style={{ color: COLORS.gray }}>
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </label>
    </div>
  );
}
