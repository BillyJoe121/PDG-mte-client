import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, RotateCcw } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PresentationStatusBadge, PRESENTATION_UI } from "./PresentationLayout";
import { entityCounts } from "./presentationEntityCounts";
import { BarLegend, formatScreenCount, StackedBar } from "./PresentationScreenParts";

type ReportEntity = StrategicBet | Goal;

export type EntitySortKey = "name" | "status" | "completedKrs" | "inProgressKrs" | "totalProjects";
export interface EntitySort {
  key: EntitySortKey;
  direction: "asc" | "desc";
}

const NUMERIC_KEYS: EntitySortKey[] = ["completedKrs", "inProgressKrs", "totalProjects"];

function sortValue(item: ReportEntity, key: EntitySortKey): string | number {
  if (key === "name") return item.name;
  if (key === "status") return item.status === "ACTIVA" ? 0 : 1;
  return entityCounts(item)[key];
}

/** Sorted copy of the items; without a sort they keep the order returned by the API. Ties keep that order too. */
export function sortEntities<T extends ReportEntity>(items: T[], sort: EntitySort | null): T[] {
  if (!sort) return items;
  const factor = sort.direction === "asc" ? 1 : -1;
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const valueA = sortValue(a.item, sort.key);
      const valueB = sortValue(b.item, sort.key);
      const result = typeof valueA === "number" && typeof valueB === "number"
        ? valueA - valueB
        : String(valueA).localeCompare(String(valueB), "es", { sensitivity: "base" });
      return result * factor || a.index - b.index;
    })
    .map(({ item }) => item);
}

interface Props<T extends ReportEntity> {
  items: T[];
  onSelect: (item: T) => void;
  summaryCardClass: string;
  accent: string;
  tableTitle: string;
  tableColumnLabel: string;
  itemLabel: string;
  pluralLabel: string;
  cardDetail: (item: T) => string;
  cardExtra?: (item: T) => ReactNode;
}

const HEAD_STYLE = { fontSize: 10.5, fontWeight: 700, color: PRESENTATION_UI.muted, textTransform: "uppercase", letterSpacing: "0.04em" } as const;

const KR_SEGMENTS = [
  { key: "completedKrs", label: "KRs completados", color: PRESENTATION_UI.green },
  { key: "inProgressKrs", label: "KRs en progreso", color: PRESENTATION_UI.orange },
] as const;

/**
 * Summary table of the recorded counts, with a thin bar of completed and in-progress KRs per row.
 * Each column can be sorted and each row opens the detail.
 */
export function EntitySummaryTable<T extends ReportEntity>(props: Props<T>) {
  const { items, onSelect } = props;
  const [sort, setSort] = useState<EntitySort | null>(null);
  const rows = sortEntities(items, sort);
  const maxKrs = Math.max(1, ...items.map((item) => {
    const counts = entityCounts(item);
    return counts.completedKrs + counts.inProgressKrs;
  }));

  const toggleSort = (key: EntitySortKey) => {
    setSort((current) => {
      if (current?.key === key) return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      return { key, direction: NUMERIC_KEYS.includes(key) ? "desc" : "asc" };
    });
  };

  const columns: { key: EntitySortKey; label: string; numeric?: boolean }[] = [
    { key: "name", label: props.tableColumnLabel },
    { key: "status", label: "Estado" },
    { key: "completedKrs", label: "KRs completados", numeric: true },
    { key: "inProgressKrs", label: "KRs en progreso", numeric: true },
    { key: "totalProjects", label: "Iniciativas", numeric: true },
  ];

  return (
    <section className={`${props.summaryCardClass} sgp-print-avoid`}>
      <div className="sgp-screen-only mb-2 flex min-h-[24px] flex-wrap items-center justify-between gap-2">
        <BarLegend items={KR_SEGMENTS.map(({ label, color }) => ({ label, color }))} />
        {sort && (
          <button
            type="button"
            onClick={() => setSort(null)}
            className="inline-flex min-h-[24px] items-center gap-1 rounded-md bg-white px-2 hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9]"
            style={{ border: "1px solid #000", fontSize: 11, fontWeight: 600, color: PRESENTATION_UI.text }}
          >
            <RotateCcw size={12} aria-hidden="true" /> Orden de registro
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg bg-white" style={{ border: `1px solid ${PRESENTATION_UI.border}` }}>
        <table aria-label={props.tableTitle} className="w-full text-left" style={{ minWidth: 640, fontSize: 12.5 }}>
          <thead style={{ backgroundColor: PRESENTATION_UI.surface, borderBottom: `1px solid ${PRESENTATION_UI.border}` }}>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
                const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={column.key} scope="col" aria-sort={ariaSort} className={`px-3 py-2 ${column.numeric ? "text-right" : ""}`}>
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`Ordenar por ${column.label}`}
                      className="inline-flex items-center gap-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9]"
                      style={{ ...HEAD_STYLE, color: active ? PRESENTATION_UI.text : HEAD_STYLE.color }}
                    >
                      {column.label}
                      <Icon size={11} className="sgp-screen-only" aria-hidden="true" />
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="px-3 py-2" style={HEAD_STYLE}>Distribución</th>
              <th scope="col" className="sgp-screen-only px-3 py-2" style={HEAD_STYLE}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const itemCounts = entityCounts(item);
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="sgp-print-avoid cursor-pointer transition-colors hover:bg-[#F8FAFC]"
                  style={{ borderBottom: `1px solid ${PRESENTATION_UI.divider}` }}
                >
                  <td className="px-3 py-3" style={{ minWidth: 240, maxWidth: 420 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: PRESENTATION_UI.text, overflowWrap: "anywhere", lineHeight: 1.4 }}>{item.name}</p>
                    <p className="line-clamp-1" style={{ fontSize: 11.5, fontWeight: 400, color: PRESENTATION_UI.muted, marginTop: 4, lineHeight: 1.45 }}>{props.cardDetail(item)}</p>
                    {props.cardExtra && <div style={{ fontSize: 11.5, fontWeight: 400, marginTop: 2, lineHeight: 1.45 }}>{props.cardExtra(item)}</div>}
                  </td>
                  <td className="px-3 py-3"><PresentationStatusBadge status={item.status} /></td>
                  {(["completedKrs", "inProgressKrs", "totalProjects"] as const).map((key) => (
                    <td
                      key={key}
                      className="px-3 py-3 text-right tabular-nums"
                      style={{ fontSize: 13.5, fontWeight: 600, color: itemCounts[key] > 0 ? PRESENTATION_UI.text : PRESENTATION_UI.subtle }}
                    >
                      {formatScreenCount(itemCounts[key])}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <StackedBar
                      total={maxKrs}
                      segments={KR_SEGMENTS.map(({ key, label, color }) => ({ label, color, value: itemCounts[key] }))}
                    />
                  </td>
                  <td className="sgp-screen-only px-3 py-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item);
                      }}
                      aria-label={`Detalle de ${item.name}`}
                      className="inline-flex min-h-[26px] items-center gap-0.5 rounded-md bg-white px-2 transition-colors hover:bg-[#111827] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-1"
                      style={{ border: "1px solid #000", fontSize: 11, fontWeight: 600 }}
                    >
                      Detalle <ChevronRight size={12} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
