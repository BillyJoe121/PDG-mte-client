import { useState } from "react";
import { Download, FileText, TrendingUp } from "lucide-react";
// recharts removed entirely — it generates duplicate null keys on clipPath/Layer
// internals when multiple chart instances coexist, even without Tooltip/Legend.
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  black: "#000",
};

// ── Pure-SVG chart primitives ─────────────────────────────────────────────────

/** Vertical bar chart */
function SvgBarChart({
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
  const barW = Math.max(8, iW / data.length - 6);
  const toX = (i: number) => PAD.left + (i + 0.5) * (iW / data.length);
  const toY = (v: number) => PAD.top + iH - (v / yMax) * iH;
  const yTicks = [0, 25, 50, 75, 100].filter((v) => v <= yMax);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* grid */}
      {yTicks.map((v) => (
        <line key={`yg-${v}`} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#F3F4F6" strokeWidth={1} />
      ))}
      {/* y-axis labels */}
      {yTicks.map((v) => (
        <text key={`yl-${v}`} x={PAD.left - 5} y={toY(v) + 4} textAnchor="end" fontSize={8} fill="#9CA3AF">{v}</text>
      ))}
      {/* bars */}
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
            {/* x-axis label */}
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
      {/* axes */}
      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth={1} />
    </svg>
  );
}

/** Grouped vertical bar chart (up to 3 series) */
function SvgGroupedBarChart({
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
  const groupW = iW / data.length;
  const barW = Math.max(6, groupW / series.length - 4);
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
function SvgLineChart({
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
  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * iW;
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
function SvgHBarChart({
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
  const barH = Math.max(8, iH / data.length - 6);
  const toY = (i: number) => PAD.top + (i + 0.5) * (iH / data.length);
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

/** Simple manual legend */
function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
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

// ── Data estática (histórica / ilustrativa) ───────────────────────────────────

const comparativoData = [
  { nombre: "2024-I",  okrCumpl: 52, proyActivos: 12, promedioAporte: 58 },
  { nombre: "2024-II", okrCumpl: 61, proyActivos: 15, promedioAporte: 65 },
  { nombre: "2025-I",  okrCumpl: 67, proyActivos: 18, promedioAporte: 72 },
];

const tendenciaData = [
  { p: "2024-I",  A1: 22, A2: 12, A3: 40 },
  { p: "2024-II", A1: 38, A2: 28, A3: 58 },
  { p: "2025-I",  A1: 72, A2: 58, A3: 83 },
];

const DEPTS = ["DCSI", "DDI", "DM", "Dirección TDI"];

// ── Component ─────────────────────────────────────────────────────────────────

export function Reportes() {
  const { usuario } = useAuth();
  const { apuestas, okrs, proyectos } = useData();
  const [periodo1, setPeriodo1] = useState("2024-II");
  const [periodo2, setPeriodo2] = useState("2025-I");
  const [tab, setTab] = useState<"general" | "departamentos" | "comparativo" | "okrs">("general");

  const PERIODOS = ["2024-I", "2024-II", "2025-I", "2025-II"];

  // ── KPIs dinámicos ───────────────────────────────────────────────────────────
  const totalProyActivos = proyectos.filter(p => p.estado === "activo").length;
  const totalFinalizados = proyectos.filter(p => p.estado === "finalizado").length;
  const activeOkrs = okrs.filter(o => o.estado === "activo");
  const promCumplimiento = activeOkrs.length
    ? Math.round(activeOkrs.reduce((s, o) => s + o.cumplimiento, 0) / activeOkrs.length)
    : 0;

  // OKRs activos para el gráfico horizontal (orden desc por cumplimiento)
  const okrBarData = activeOkrs
    .map(o => ({
      id: o.id,
      objetivo: o.objetivo.slice(0, 30) + "...",
      cumplimiento: o.cumplimiento,
      dept: o.departamento,
    }))
    .sort((a, b) => b.cumplimiento - a.cumplimiento);

  // ── Stats por departamento (calculados desde el context) ─────────────────────
  const deptStatsLive = DEPTS.map(dept => {
    const deptProys = proyectos.filter(p => p.departamento === dept);
    const deptOkrs  = okrs.filter(o => o.departamento === dept && o.estado === "activo");
    const cumplProm = deptOkrs.length
      ? Math.round(deptOkrs.reduce((s, o) => s + o.cumplimiento, 0) / deptOkrs.length)
      : 0;
    return {
      dept,
      activos:       deptProys.filter(p => p.estado === "activo").length,
      okrsCubiertos: deptOkrs.filter(o => o.proyectoIds.length > 0).length,
      cumpl:         cumplProm,
      enRiesgo:      deptProys.filter(p => p.avanceGlobal < 30 && p.estado === "activo").length,
    };
  });

  // Contribución por dept × apuesta (% cumplimiento promedio de OKRs de esa apuesta en ese dept)
  const deptContribucionLive = DEPTS.map(dept => {
    const row: Record<string, any> = { dept };
    apuestas.forEach((a, i) => {
      const subOkrs = okrs.filter(
        o => o.apuestaId === a.id && o.departamento === dept && o.estado === "activo"
      );
      row[`A${i + 1}`] = subOkrs.length
        ? Math.round(subOkrs.reduce((s, o) => s + o.cumplimiento, 0) / subOkrs.length)
        : 0;
    });
    return row;
  });

  // Series dinámicas del grouped chart (una serie por apuesta)
  const apuestaSeries = apuestas.map((a, i) => ({
    key: `A${i + 1}`,
    color: [COLORS.blue, COLORS.green, COLORS.orange, "#7C3AED"][i % 4],
    label: a.nombre,
  }));

  // Tendencia: datos históricos ilustrativos + valor actual
  const tendenciaKeys = apuestas.map((_, i) => `A${i + 1}`);
  const tendenciaDataFull = [
    ...tendenciaData,
    {
      p: "2025-I (actual)",
      ...Object.fromEntries(apuestas.map((a, i) => [`A${i + 1}`, a.cumplimiento])),
    },
  ];

  // Comparativo periodos
  const p1 = comparativoData.find(d => d.nombre === periodo1);
  const p2 = comparativoData.find(d => d.nombre === periodo2);

  return (
    <div className="p-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Proyectos Activos", value: totalProyActivos, color: COLORS.blue, sub: "En periodo 2025-I" },
          { label: "Proyectos Finalizados", value: totalFinalizados, color: COLORS.green, sub: "Con evidencia de cierre" },
          { label: "Cumpl. Promedio OKRs", value: `${promCumplimiento}%`, color: COLORS.orange, sub: "OKRs activos 2025-I" },
          {
            label: "Cobertura de OKRs",
            value: `${activeOkrs.filter((o) => o.proyectoIds.length > 0).length}/${activeOkrs.length}`,
            color: "#7C3AED",
            sub: "OKRs con proyectos vinculados",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <p style={{ fontSize: "26px", fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-6 rounded-lg overflow-hidden w-fit" style={{ border: "1.5px solid #000" }}>
        {[
          { key: "general", label: "General" },
          { key: "departamentos", label: "Departamentos" },
          { key: "okrs", label: "Por OKR" },
          { key: "comparativo", label: "Comparativo" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              padding: "8px 18px",
              fontSize: "12px",
              fontWeight: 700,
              backgroundColor: tab === t.key ? "#000" : "#fff",
              color: tab === t.key ? "#fff" : "#374151",
              transition: "all 0.15s",
              borderRight: "1px solid #000",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {tab === "general" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Cumplimiento por Apuesta Estratégica</h3>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Porcentaje de avance acumulado por cada apuesta</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 rounded border hover:bg-gray-50" style={{ fontSize: "11px", fontWeight: 600 }}>
                <Download size={13} /> PDF
              </button>
            </div>
            <SvgBarChart
              data={apuestas}
              dataKey="cumplimiento"
              labelKey="nombre"
              labelAngle={-30}
              height={230}
              colorFn={(_, i) => [COLORS.blue, COLORS.green, COLORS.orange][i % 3]}
            />
          </div>

          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <div className="mb-4">
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Tendencia de Cumplimiento por Periodo</h3>
              <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Evolución histórica de las 3 apuestas estratégicas</p>
            </div>
            <SvgLineChart
              data={tendenciaDataFull}
              xKey="p"
              height={200}
              series={[
                { key: "A1", color: COLORS.blue, label: "Apuesta 1 – Innovación" },
                { key: "A2", color: COLORS.green, label: "Apuesta 2 – Investigación" },
                { key: "A3", color: COLORS.orange, label: "Apuesta 3 – Bienestar" },
              ]}
            />
            <ChartLegend items={[
              { label: "Apuesta 1 – Innovación", color: COLORS.blue },
              { label: "Apuesta 2 – Investigación", color: COLORS.green },
              { label: "Apuesta 3 – Bienestar", color: COLORS.orange },
            ]} />
          </div>
        </div>
      )}

      {/* Tab: Departamentos */}
      {tab === "departamentos" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", marginBottom: 4 }}>
              Aporte por Departamento a cada Apuesta
            </h3>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: 16 }}>% de cumplimiento promedio por departamento y apuesta</p>
            <SvgGroupedBarChart
              data={deptContribucionLive}
              labelKey="dept"
              height={240}
              series={[
                { key: "A1", color: COLORS.blue, label: "Apuesta 1" },
                { key: "A2", color: COLORS.green, label: "Apuesta 2" },
                { key: "A3", color: COLORS.orange, label: "Apuesta 3" },
              ]}
            />
            <ChartLegend items={[
              { label: "Apuesta 1", color: COLORS.blue },
              { label: "Apuesta 2", color: COLORS.green },
              { label: "Apuesta 3", color: COLORS.orange },
            ]} />
          </div>

          <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000", backgroundColor: "#000" }}>
                  {["Departamento", "Proyectos Activos", "OKRs Cubiertos", "Cumpl. Promedio", "Proyectos en Riesgo"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptStatsLive.map((row, i) => (
                  <tr key={row.dept} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 700, color: "#000" }}>{row.dept}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#374151" }}>{row.activos}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#374151" }}>{row.okrsCubiertos}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full overflow-hidden" style={{ height: 6, width: 80, backgroundColor: "#F3F4F6" }}>
                          <div style={{ width: `${row.cumpl}%`, height: "100%", backgroundColor: row.cumpl >= 60 ? COLORS.green : COLORS.orange, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: row.cumpl >= 60 ? COLORS.green : COLORS.orange }}>{row.cumpl}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: row.enRiesgo > 0 ? COLORS.orange : COLORS.green }}>
                        {row.enRiesgo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Por OKR */}
      {tab === "okrs" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", marginBottom: 4 }}>Cumplimiento por OKR</h3>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: 16 }}>OKRs activos ordenados por % de cumplimiento descendente</p>
            <SvgHBarChart
              data={okrBarData}
              dataKey="cumplimiento"
              labelKey="id"
              height={Math.max(200, okrBarData.length * 38 + 40)}
              colorFn={(d) => d.cumplimiento >= 70 ? COLORS.green : d.cumplimiento >= 40 ? COLORS.blue : COLORS.orange}
            />
          </div>
        </div>
      )}

      {/* Tab: Comparativo */}
      {tab === "comparativo" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", marginBottom: 12 }}>
              Comparación entre Periodos Académicos
            </h3>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Periodo A</label>
                <select
                  value={periodo1}
                  onChange={(e) => setPeriodo1(e.target.value)}
                  style={{ border: "2px solid #5454E9", borderRadius: 6, padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: "#5454E9" }}
                >
                  {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#9CA3AF", alignSelf: "flex-end", paddingBottom: 6 }}>vs</div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", display: "block", marginBottom: 4 }}>Periodo B</label>
                <select
                  value={periodo2}
                  onChange={(e) => setPeriodo2(e.target.value)}
                  style={{ border: "2px solid #4CB979", borderRadius: 6, padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: "#4CB979" }}
                >
                  {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {p1 && p2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Cumpl. OKRs", v1: p1.okrCumpl, v2: p2.okrCumpl, unit: "%" },
                  { label: "Proyectos Activos", v1: p1.proyActivos, v2: p2.proyActivos, unit: "" },
                  { label: "Prom. de Aporte", v1: p1.promedioAporte, v2: p2.promedioAporte, unit: "%" },
                ].map((m) => {
                  const diff = m.v2 - m.v1;
                  const improved = diff >= 0;
                  return (
                    <div key={m.label} className="rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
                      <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: 8 }}>{m.label}</p>
                      <div className="flex items-end gap-4">
                        <div>
                          <p style={{ fontSize: "10px", color: "#5454E9", fontWeight: 700, marginBottom: 2 }}>{periodo1}</p>
                          <p style={{ fontSize: "22px", fontWeight: 800, color: "#5454E9" }}>{m.v1}{m.unit}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "10px", color: "#4CB979", fontWeight: 700, marginBottom: 2 }}>{periodo2}</p>
                          <p style={{ fontSize: "22px", fontWeight: 800, color: "#4CB979" }}>{m.v2}{m.unit}</p>
                        </div>
                        <div
                          className="mb-1 px-2 py-1 rounded flex items-center gap-1"
                          style={{ backgroundColor: improved ? "#ECFDF5" : "#FEF3F2" }}
                        >
                          <TrendingUp size={12} color={improved ? COLORS.green : COLORS.orange} />
                          <span style={{ fontSize: "12px", fontWeight: 800, color: improved ? COLORS.green : COLORS.orange }}>
                            {improved ? "+" : ""}{diff}{m.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <SvgGroupedBarChart
              data={comparativoData}
              labelKey="nombre"
              height={200}
              yMax={100}
              series={[
                { key: "okrCumpl", color: COLORS.blue, label: "Cumpl. OKRs %" },
                { key: "promedioAporte", color: COLORS.green, label: "Prom. Aporte %" },
              ]}
            />
            <ChartLegend items={[
              { label: "Cumpl. OKRs %", color: COLORS.blue },
              { label: "Prom. Aporte %", color: COLORS.green },
            ]} />
          </div>
        </div>
      )}

      {/* Export section */}
      <div
        className="mt-6 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: "#000" }}
      >
        <div>
          <h3 style={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}>Exportar Reporte de Impacto Estratégico</h3>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginTop: 4 }}>
            Genera un reporte PDF con los filtros aplicados · Identidad visual ICESI incluida
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#E4EB60", color: "#000", fontSize: "12px", fontWeight: 700 }}
          >
            <FileText size={14} /> Exportar PDF
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: "12px", fontWeight: 600, backgroundColor: "transparent" }}
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
}