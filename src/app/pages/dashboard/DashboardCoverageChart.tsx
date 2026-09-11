import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type BucketKey = "completedObjectives" | "objectivesAbove50" | "objectivesBetween0And50" | "objectivesAtZero";

type CoverageItem = {
  id: number;
  name: string;
  completedObjectives: number;
  objectivesAbove50: number;
  objectivesBetween0And50: number;
  objectivesAtZero: number;
};

type Props = {
  data: CoverageItem[];
  metricLabel: string;
  index: number;
  total: number;
  labelMaxLines: number;
  onBucketClick: (item: CoverageItem, bucket: BucketKey) => void;
};

const meta = {
  completedObjectives: { label: "Objetivos al 100", color: "#4CB979" },
  objectivesAbove50: { label: "50% o más", color: "#5454E9" },
  objectivesBetween0And50: { label: "De 0 a 50", color: "#E9683B" },
  objectivesAtZero: { label: "Al 0", color: "#DC2626" },
} as const;

function wrapLabel(value: string, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    if (!current || `${current} ${word}`.length <= 26) current = current ? `${current} ${word}` : word;
    else { lines.push(current); current = word; }
  });
  if (current) lines.push(current);
  const result = lines.length ? lines : [value];
  return result.length > maxLines ? [...result.slice(0, maxLines - 1), result.slice(maxLines - 1).join(" ")] : result;
}

function AxisTick({ x, y, payload, maxLines }: { x?: number; y?: number; payload?: { value?: string }; maxLines: number }) {
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      {wrapLabel(String(payload?.value ?? ""), maxLines).map((line, index) => (
        <text key={`${line}-${index}`} x={0} y={index * 17 + 14} textAnchor="middle" fill="#717182" fontSize={12} fontWeight={700}>{line}</text>
      ))}
    </g>
  );
}

export default function DashboardCoverageChart({ data, metricLabel, index, total, labelMaxLines, onBucketClick }: Props) {
  const maxLines = Math.max(1, ...data.map((item) => wrapLabel(item.name, labelMaxLines).length));
  const axisHeight = Math.max(72, maxLines * 17 + 40);
  const yMax = Math.max(1, ...data.map((item) => Math.max(item.completedObjectives, item.objectivesAbove50, item.objectivesBetween0And50, item.objectivesAtZero)));
  const handleClick = (payload: unknown, bucket: BucketKey) => {
    const item = (payload as { payload?: CoverageItem } | undefined)?.payload;
    if (item && item[bucket] > 0) onBucketClick(item, bucket);
  };

  return (
    <div className="rounded-md border border-[#D9DEE8] bg-[#F8FAFC] p-3">
      {total > 1 && <p className="mb-2 text-[10px] font-extrabold uppercase text-[#9CA3AF]">{metricLabel}s {index * 6 + 1}-{index * 6 + data.length}</p>}
      <div style={{ width: "100%", height: 260 + axisHeight }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" interval={0} height={axisHeight} tick={<AxisTick maxLines={labelMaxLines} />} tickLine={false} />
            <YAxis allowDecimals={false} domain={[0, yMax]} tick={{ fontSize: 11, fill: "#717182" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 800, paddingTop: 8 }} />
            <Tooltip cursor={{ fill: "#F8FAFC" }} formatter={(value, name) => [Number(value), `${String(name)} - clic para ver objetivos`]} contentStyle={{ padding: "6px 10px", fontSize: "10px", borderRadius: "6px", lineHeight: "1.2" }} />
            {(Object.keys(meta) as BucketKey[]).map((bucket) => (
              <Bar key={bucket} className="cursor-pointer" dataKey={bucket} name={meta[bucket].label} fill={meta[bucket].color} onClick={(payload) => handleClick(payload, bucket)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
