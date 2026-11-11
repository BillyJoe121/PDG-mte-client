import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PRESENTATION_UI } from "./PresentationLayout";
import { entityCounts } from "./presentationEntityCounts";
import { BarLegend, StackedBar } from "./PresentationScreenParts";

type ReportEntity = StrategicBet | Goal;
type SeriesKey = "completedKrs" | "inProgressKrs" | "totalProjects";

/** Same colors as the slides: green completed, orange in progress, blue initiatives. */
export const ENTITY_SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "completedKrs", label: "KRs completados", color: PRESENTATION_UI.green },
  { key: "inProgressKrs", label: "KRs en progreso", color: PRESENTATION_UI.orange },
  { key: "totalProjects", label: "Iniciativas vinculadas", color: PRESENTATION_UI.blue },
];

interface Props<T extends ReportEntity> {
  items: T[];
  onSelect: (item: T) => void;
  itemLabel: string;
}

/**
 * Horizontal bars with the counts recorded for each entity, in the order returned by the API.
 * Every bar is relative to the largest recorded count, and each row opens the detail.
 */
export function EntityCountsChart<T extends ReportEntity>({ items, onSelect, itemLabel }: Props<T>) {
  const rows = items.map((item) => ({ item, counts: entityCounts(item) }));
  const max = Math.max(1, ...rows.flatMap((row) => ENTITY_SERIES.map((series) => row.counts[series.key])));

  return (
    <div>
      <BarLegend items={ENTITY_SERIES} />
      <ol className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 lg:grid-cols-2" aria-label={`Conteos registrados por ${itemLabel.toLowerCase()}`}>
        {rows.map(({ item, counts }) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              aria-label={`Detalle de ${item.name}`}
              className="flex w-full items-center justify-between gap-3 rounded-md px-1.5 py-1 text-left hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9]"
            >
              <span className="min-w-0 truncate" style={{ fontSize: 12.5, fontWeight: 800, color: PRESENTATION_UI.text }}>{item.name}</span>
              <StackedBar
                total={max * ENTITY_SERIES.length}
                segments={ENTITY_SERIES.map((series) => ({ label: series.label, value: counts[series.key], color: series.color }))}
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
