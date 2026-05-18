export const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  black: "#000",
};

/** Vertical bar chart */
export function SvgBarChart({
  data,
  dataKey,
  colorFn,
  height = 220,
  yMax = 100,
  labelKey = "nombre",
  labelAngle = 0,
  showValueLabel = true,
}: {
  data: Record<string, any>[];
  dataKey: string;
  colorFn?: (d: Record<string, any>, i: number) => string;
  height?: number;
  yMax?: number;
  labelKey?: string;
  labelAngle?: number;
  showValueLabel?: boolean;
}) {
  const PAD = { top: 16, right: 12, bottom: labelAngle ? 64 : 28, left: 36 };
  const W = 560;
  const H = height;
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const barW = Math.max(8, iW / Math.max(data.length, 1) - 6);
  const toX = (i: number) => PAD.left + (i + 0.5) * (iW / Math.max(data.length, 1));
  const toY = (v: number) => PAD.top + iH - (v / yMax) * iH;
  const yTicks = [0, 25, 50, 75, 100].filter((v) => v <= yMax);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {yTicks.map((v) => (
        <line key={`yg-${v}`} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#F3F4F6" strokeWidth={1} />
      ))}
      {yTicks.map((v) => (
        <text key={`yl-${v}`} x={PAD.left - 5} y={toY(v) + 4} textAnchor="end" fontSize={8} fill="#9CA3AF">{v}</text>
      ))}
      {data.map((d, i) => {
        const val = Number(d[dataKey]) || 0;
        const x = toX(i) - barW / 2;
        const barH = (val / yMax) * iH;
        const y = toY(val);
        const color = colorFn ? colorFn(d, i) : COLORS.blue;
        return (
          <g key={`bar-${i}`}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx={3} ry={3} />
            {showValueLabel && (
              <text x={toX(i)} y={y - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={color}>{val}%</text>
            )}
            {labelAngle ? (
              <text
                x={toX(i)}
                y={H - PAD.bottom + 14}
                textAnchor="end"
                fontSize={8}
                fill="#9CA3AF"
                transform={`rotate(${labelAngle}, ${toX(i)}, ${H - PAD.bottom + 14})`}
              >
                {String(d[labelKey]).slice(0, 22)}
              </text>
            ) : (
              <text x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">
                {String(d[labelKey]).slice(0, 12)}
              </text>
            )}
          </g>
        );
      })}
      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  );
}

/** Grouped vertical bar chart */
export function SvgGroupedBarChart({
  data,
  series,
  height = 240,
  yMax = 100,
  labelKey = "dept",
}: {
  data: Record<string, any>[];
  series: { key: string; color: string; label: string }[];
  height?: number;
  yMax?: number;
  labelKey?: string;
}) {
  const PAD = { top: 16, right: 12, bottom: 28, left: 36 };
  const W = 560;
  const H = height;
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const groupW = iW / Math.max(data.length, 1);
  const barW = Math.max(6, groupW / Math.max(series.length, 1) - 4);
  const toY = (v: number) => PAD.top + iH - (v / yMax) * iH;
  const yTicks = [0, 25, 50, 75, 100].filter((v) => v <= yMax);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {yTicks.map((v) => (
        <line key={`yg-${v}`} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#F3F4F6" strokeWidth={1} />
      ))}
      {yTicks.map((v) => (
        <text key={`yl-${v}`} x={PAD.left - 5} y={toY(v) + 4} textAnchor="end" fontSize={8} fill="#9CA3AF">{v}</text>
      ))}
      {data.map((d, gi) => {
        const groupX = PAD.left + gi * groupW + groupW / 2 - (series.length * (barW + 3)) / 2;
        return (
          <g key={`group-${gi}`}>
            {series.map((s, si) => {
              const val = Number(d[s.key]) || 0;
              const x = groupX + si * (barW + 3);
              const barH = (val / yMax) * iH;
              const y = toY(val);
              return (
                <rect key={`b-${gi}-${si}`} x={x} y={y} width={barW} height={barH} fill={s.color} rx={2} />
              );
            })}
            <text x={PAD.left + gi * groupW + groupW / 2} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">
              {String(d[labelKey]).slice(0, 10)}
            </text>
          </g>
        );
      })}
      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  );
}

/** Multi-line chart */
export function SvgLineChart({
  data,
  series,
  xKey = "p",
  height = 200,
  yMax = 100,
}: {
  data: Record<string, any>[];
  series: { key: string; color: string; label: string }[];
  xKey?: string;
  height?: number;
  yMax?: number;
}) {
  const PAD = { top: 16, right: 12, bottom: 28, left: 36 };
  const W = 560;
  const H = height;
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const toX = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * iW;
  const toY = (v: number) => PAD.top + iH - (v / yMax) * iH;
  const yTicks = [0, 25, 50, 75, 100].filter((v) => v <= yMax);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {yTicks.map((v) => (
        <line key={`yg-${v}`} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#F3F4F6" strokeWidth={1} />
      ))}
      {yTicks.map((v) => (
        <text key={`yl-${v}`} x={PAD.left - 5} y={toY(v) + 4} textAnchor="end" fontSize={8} fill="#9CA3AF">{v}</text>
      ))}
      {series.map((s) => {
        const pts = data.map((d, i) => `${toX(i)},${toY(Number(d[s.key]) || 0)}`).join(" ");
        return (
          <g key={`series-${s.key}`}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d, i) => (
              <circle key={`dot-${i}`} cx={toX(i)} cy={toY(Number(d[s.key]) || 0)} r={4} fill={s.color} />
            ))}
          </g>
        );
      })}
      {data.map((d, i) => (
        <text key={`xl-${i}`} x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">
          {String(d[xKey])}
        </text>
      ))}
      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  );
}

/** Horizontal bar chart */
export function SvgHBarChart({
  data,
  dataKey,
  labelKey = "id",
  colorFn,
  height = 280,
  xMax = 100,
}: {
  data: Record<string, any>[];
  dataKey: string;
  labelKey?: string;
  colorFn?: (d: Record<string, any>) => string;
  height?: number;
  xMax?: number;
}) {
  const PAD = { top: 8, right: 52, bottom: 28, left: 56 };
  const W = 560;
  const H = height;
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const barH = Math.max(8, iH / Math.max(data.length, 1) - 6);
  const toY = (i: number) => PAD.top + (i + 0.5) * (iH / Math.max(data.length, 1));
  const toX = (v: number) => PAD.left + (v / xMax) * iW;
  const xTicks = [0, 25, 50, 75, 100].filter((v) => v <= xMax);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {xTicks.map((v) => (
        <line key={`xg-${v}`} x1={toX(v)} x2={toX(v)} y1={PAD.top} y2={H - PAD.bottom} stroke="#F3F4F6" strokeWidth={1} />
      ))}
      {xTicks.map((v) => (
        <text key={`xl-${v}`} x={toX(v)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{v}</text>
      ))}
      {data.map((d, i) => {
        const val = Number(d[dataKey]) || 0;
        const y = toY(i) - barH / 2;
        const bW = (val / xMax) * iW;
        const color = colorFn ? colorFn(d) : COLORS.blue;
        return (
          <g key={`hbar-${i}`}>
            <text x={PAD.left - 4} y={toY(i) + 4} textAnchor="end" fontSize={9} fill="#374151" fontWeight={600}>
              {String(d[labelKey]).slice(0, 7)}
            </text>
            <rect x={PAD.left} y={y} width={bW} height={barH} fill={color} rx={3} />
            <text x={toX(val) + 4} y={toY(i) + 4} textAnchor="start" fontSize={9} fontWeight={700} fill={color}>{val}%</text>
          </g>
        );
      })}
      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-3 pl-2">
      {items.map((l) => (
        <div key={l.label} className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.color }} />
          <span style={{ fontSize: 10, color: "#374151" }}>{l.label}</span>
        </div>
      ))}
    </div>
  );
}
