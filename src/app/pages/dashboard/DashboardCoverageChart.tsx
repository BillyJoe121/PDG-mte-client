import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { KeyResultStatus } from "../../services/strategicApi";
import { KEY_RESULT_STATUS_ORDER, keyResultStatusColor, keyResultStatusCountField, keyResultStatusLabel } from "./keyResultStatusMeta";

type StatusCounts = {
  id: number;
  name: string;
  draftKeyResults: number;
  activeKeyResults: number;
  closedKeyResults: number;
};

type Props<T extends StatusCounts> = {
  data: T[];
  metricLabel: string;
  index: number;
  total: number;
  labelMaxLines: number;
  onStatusClick: (item: T, status: KeyResultStatus) => void;
};

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

export default function DashboardCoverageChart<T extends StatusCounts>({ data, metricLabel, index, total, labelMaxLines, onStatusClick }: Props<T>) {
  const maxLines = Math.max(1, ...data.map((item) => wrapLabel(item.name, labelMaxLines).length));
  const axisHeight = Math.max(72, maxLines * 17 + 40);
  const yMax = Math.max(1, ...data.map((item) => Math.max(item.draftKeyResults, item.activeKeyResults, item.closedKeyResults)));
  const handleClick = (payload: unknown, status: KeyResultStatus) => {
    const item = (payload as { payload?: T } | undefined)?.payload;
    if (item && item[keyResultStatusCountField[status]] > 0) onStatusClick(item, status);
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
            <Tooltip cursor={{ fill: "#F8FAFC" }} formatter={(value, name) => [Number(value), `${String(name)} - clic para ver KRs`]} contentStyle={{ padding: "6px 10px", fontSize: "10px", borderRadius: "6px", lineHeight: "1.2" }} />
            {KEY_RESULT_STATUS_ORDER.map((status) => (
              <Bar key={status} className="cursor-pointer" dataKey={keyResultStatusCountField[status]} name={keyResultStatusLabel[status]} fill={keyResultStatusColor[status]} onClick={(payload) => handleClick(payload, status)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
