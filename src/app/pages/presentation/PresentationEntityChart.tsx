import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PRESENTATION_UI } from "./PresentationLayout";
import { entityCounts } from "./presentationEntityCounts";
import { usePresentationNarrow } from "./usePresentationNarrow";

type ReportEntity = StrategicBet | Goal;
type SeriesKey = "completedKrs" | "inProgressKrs" | "totalProjects";

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "completedKrs", label: "KRs completados", color: "#B8461F" },
  { key: "inProgressKrs", label: "KRs en progreso", color: "#E9683B" },
  { key: "totalProjects", label: "Iniciativas vinculadas", color: "#4CB979" },
];

function shorten(name: string, max: number) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

interface Props<T extends ReportEntity> {
  items: T[];
  onSelect: (item: T) => void;
}

/**
 * Bar chart of the counts recorded for each entity. Below `sm` it turns into horizontal bars so the
 * names stay readable. A series with no recorded value in any entity is left out of the chart.
 */
export function EntityCountsChart<T extends ReportEntity>({ items, onSelect }: Props<T>) {
  const narrow = usePresentationNarrow();
  const data = items.map((item) => ({
    name: shorten(item.name, narrow ? 18 : 25),
    fullName: item.name,
    ...entityCounts(item),
    raw: item,
  }));
  const withValues = SERIES.filter((series) => data.some((row) => row[series.key] > 0));
  const series = withValues.length > 0 ? withValues : SERIES;
  const height = narrow ? Math.max(220, data.length * (series.length * 12 + 22) + 70) : 300;

  const axisText = { fill: PRESENTATION_UI.text, fontSize: narrow ? 10 : 11, fontWeight: 700 };
  const valueText = { fill: PRESENTATION_UI.muted, fontSize: 11, fontWeight: 600 };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={narrow ? "vertical" : "horizontal"}
          margin={narrow ? { top: 4, right: 12, left: 0, bottom: 4 } : { top: 20, right: 30, left: 0, bottom: 25 }}
          onClick={(event) => {
            const active = event?.activePayload?.[0]?.payload;
            if (active?.raw) onSelect(active.raw as T);
          }}
          className="cursor-pointer"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={narrow} horizontal={!narrow} stroke="#E9ECF2" />
          {narrow ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={valueText} />
              <YAxis type="category" dataKey="name" width={118} interval={0} tick={axisText} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={axisText} interval={0} height={40} />
              <YAxis allowDecimals={false} tick={valueText} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "#F1F3F8" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload;
              return (
                <div className="rounded-md bg-white p-3 text-xs" style={{ border: `1px solid ${PRESENTATION_UI.border}`, boxShadow: PRESENTATION_UI.shadow }}>
                  <p className="mb-1 text-sm font-black text-[#111827]">{row.fullName}</p>
                  {SERIES.map((item) => (
                    <p key={item.key} className="font-bold" style={{ color: item.color }}>
                      {item.label}: <span className="text-[#111827]">{row[item.key]}</span>
                    </p>
                  ))}
                  <p className="mt-2 text-[11px] font-extrabold text-[#5454E9]">Haz clic para ver el detalle</p>
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11, fontWeight: 700 }} iconType="square" iconSize={10} />
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={item.color}
              maxBarSize={narrow ? 12 : 28}
              radius={narrow ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
