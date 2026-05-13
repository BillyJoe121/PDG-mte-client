import { FolderKanban, Target, TrendingUp, AlertTriangle, Presentation, ArrowUpRight, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { useData } from "../context/DataContext";
import { diasSinRegistro } from "../data/mockData";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  black: "#000000",
  gray: "#717182",
};

// pieData, radarData — eliminados del módulo: dependen de datos runtime,
// se calculan dentro del componente con useData().

export function Dashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { proyectos, okrs, apuestas } = useData();

  const proyectosActivos = proyectos.filter((p) => p.estado === "activo");
  const okrsActivos = okrs.filter((o) => o.estado === "activo");
  const okrsCubiertos = okrsActivos.filter((o) => o.proyectoIds.length > 0).length;
  const cumplimientoProm = okrsActivos.length
    ? Math.round(okrsActivos.reduce((s, o) => s + o.cumplimiento, 0) / okrsActivos.length)
    : 0;
  const enRiesgo = proyectosActivos.filter((p) => diasSinRegistro(p.ultimoRegistro) > 28).length;

  const pieData = [
    { name: "Activos",     value: proyectos.filter((p) => p.estado === "activo").length,     color: COLORS.green },
    { name: "Finalizados", value: proyectos.filter((p) => p.estado === "finalizado").length,  color: COLORS.blue  },
    { name: "Borrador",    value: proyectos.filter((p) => p.estado === "borrador").length,    color: COLORS.gray  },
    { name: "Suspendidos", value: proyectos.filter((p) => p.estado === "suspendido").length,  color: COLORS.orange},
  ];

  const trendData = [
    { corte: "Ago 2024", A1: 28, A2: 18, A3: 52 },
    { corte: "Oct 2024", A1: 38, A2: 28, A3: 63 },
    { corte: "Dic 2024", A1: 50, A2: 38, A3: 72 },
    { corte: "Feb 2025", A1: 60, A2: 46, A3: 78 },
    { corte: "Abr 2025", A1: 72, A2: 58, A3: 83 },
  ];

  const deptData = [
    { dept: "DCSI", proyectos: 12, cumplimiento: 68, okrs: 5 },
    { dept: "DDI", proyectos: 3, cumplimiento: 45, okrs: 2 },
    { dept: "DM", proyectos: 1, cumplimiento: 33, okrs: 1 },
    { dept: "Dir. TDI", proyectos: 3, cumplimiento: 72, okrs: 2 },
  ];

  const radarData = [
    { subject: "DCSI", cumplimiento: 68 },
    { subject: "DDI", cumplimiento: 45 },
    { subject: "DM", cumplimiento: 33 },
    { subject: "Dir. TDI", cumplimiento: 72 },
  ];

  const kpis = [
    {
      label: "Proyectos Activos",
      value: proyectosActivos.length,
      icon: FolderKanban,
      color: COLORS.blue,
      sub: `${proyectos.filter((p) => p.estado === "finalizado").length} finalizados este periodo`,
    },
    {
      label: "OKRs con Cobertura",
      value: `${okrsCubiertos}/${okrsActivos.length}`,
      icon: Target,
      color: COLORS.yellow,
      sub: `${Math.round((okrsCubiertos / okrsActivos.length) * 100)}% de OKRs activos cubiertos`,
    },
    {
      label: "Cumplimiento Promedio",
      value: `${cumplimientoProm}%`,
      icon: TrendingUp,
      color: COLORS.green,
      sub: "Promedio ponderado de OKRs activos",
    },
    {
      label: "Proyectos en Riesgo",
      value: enRiesgo,
      icon: AlertTriangle,
      color: COLORS.orange,
      sub: "Sin registro de avance en >28 días",
    },
  ];

  const proyectosSinAvance = proyectosActivos
    .filter((p) => diasSinRegistro(p.ultimoRegistro) > 20)
    .sort((a, b) => diasSinRegistro(b.ultimoRegistro) - diasSinRegistro(a.ultimoRegistro))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#000" }}>
            Bienvenido, {usuario?.nombre.split(" ")[0]}
          </h2>
          <p style={{ fontSize: "12px", color: "#717182", marginTop: 2 }}>
            Periodo académico activo: <strong style={{ color: "#5454E9" }}>2025-I</strong> · Última actualización: 14 de abril de 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded"
            style={{ backgroundColor: "#E4EB60", color: "#000", fontSize: "11px", fontWeight: 700 }}
          >
            {apuestas.filter((a) => a.estado === "activa").length} Apuestas Activas
          </span>
          {(usuario?.rol === "director" || usuario?.rol === "administrador") && (
            <button
              onClick={() => navigate("/presentacion")}
              className="flex items-center gap-2 px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#000", color: "#fff", fontSize: "11px", fontWeight: 700 }}
            >
              <Presentation size={13} /> Modo Presentación
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg p-5 bg-white"
            style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 40, height: 40, backgroundColor: kpi.color + "18" }}
              >
                <kpi.icon size={20} color={kpi.color} strokeWidth={2} />
              </div>
              <ArrowUpRight size={14} color="#9CA3AF" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#000", lineHeight: 1.1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#000", marginTop: 4 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 2 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar chart: Apuestas */}
        <div
          className="xl:col-span-2 bg-white rounded-lg p-5"
          style={{ border: "1.5px solid #E5E7EB" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>
                Cumplimiento por Apuesta Estratégica
              </h3>
              <p style={{ fontSize: "11px", color: "#9CA3AF" }}>% de cumplimiento acumulado</p>
            </div>
            <span style={{ fontSize: "10px", color: "#9CA3AF" }}>Periodo 2025-I</span>
          </div>
          <svg viewBox="0 0 600 200" width="100%" height={200} preserveAspectRatio="none">
            {[0, 25, 50, 75, 100].map((g) => {
              const y = 180 - (g / 100) * 160;
              return (
                <g key={`grid-${g}`}>
                  <line x1={40} y1={y} x2={590} y2={y} stroke="#F3F4F6" strokeWidth={1} />
                  <text x={36} y={y + 3} fontSize={9} fill="#9CA3AF" textAnchor="end">{g}</text>
                </g>
              );
            })}
            {apuestas.map((a, i) => {
              const bw = (550 / apuestas.length) * 0.6;
              const slot = 550 / apuestas.length;
              const x = 40 + slot * i + (slot - bw) / 2;
              const h = (a.cumplimiento / 100) * 160;
              const color = [COLORS.blue, COLORS.green, COLORS.yellow][i % 3];
              return (
                <g key={`bar-${a.id}`}>
                  <rect x={x} y={180 - h} width={bw} height={h} fill={color} rx={4} />
                  <text x={x + bw / 2} y={195} fontSize={9} fill="#9CA3AF" textAnchor="middle">
                    {a.nombre.split(" ").slice(0, 2).join(" ")}
                  </text>
                  <text x={x + bw / 2} y={180 - h - 4} fontSize={10} fill="#000" fontWeight={700} textAnchor="middle">
                    {a.cumplimiento}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Pie chart: Estado proyectos */}
        <div
          className="bg-white rounded-lg p-5"
          style={{ border: "1.5px solid #E5E7EB" }}
        >
          <div className="mb-4">
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Estado del Portafolio</h3>
            <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Distribución de proyectos</p>
          </div>
          {(() => {
            const total = pieData.reduce((s, d) => s + d.value, 0) || 1;
            let acc = 0;
            const cx = 100, cy = 70, ro = 60, ri = 38;
            const arcs = pieData.map((d) => {
              const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
              acc += d.value;
              const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
              const large = end - start > Math.PI ? 1 : 0;
              const x1 = cx + ro * Math.cos(start), y1 = cy + ro * Math.sin(start);
              const x2 = cx + ro * Math.cos(end), y2 = cy + ro * Math.sin(end);
              const x3 = cx + ri * Math.cos(end), y3 = cy + ri * Math.sin(end);
              const x4 = cx + ri * Math.cos(start), y4 = cy + ri * Math.sin(start);
              const path = `M ${x1} ${y1} A ${ro} ${ro} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z`;
              return { path, color: d.color, name: d.name };
            });
            return (
              <svg viewBox="0 0 200 140" width="100%" height={140}>
                {arcs.map((a) => (
                  <path key={`pie-${a.name}`} d={a.path} fill={a.color} />
                ))}
              </svg>
            );
          })()}
          <div className="space-y-1 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span style={{ fontSize: "11px", color: "#374151" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#000" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Line chart trend */}
        <div
          className="xl:col-span-2 bg-white rounded-lg p-5"
          style={{ border: "1.5px solid #E5E7EB" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>
                Tendencia Histórica de Cumplimiento
              </h3>
              <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Por apuesta estratégica</p>
            </div>
          </div>
          {(() => {
            const W = 600, H = 180, padL = 40, padR = 10, padT = 10, padB = 30;
            const innerW = W - padL - padR, innerH = H - padT - padB;
            const xFor = (i: number) => padL + (i * innerW) / Math.max(1, trendData.length - 1);
            const yFor = (v: number) => padT + innerH - (v / 100) * innerH;
            const series: { key: "A1" | "A2" | "A3"; name: string; color: string }[] = [
              { key: "A1", name: "Apuesta 1", color: COLORS.blue },
              { key: "A2", name: "Apuesta 2", color: COLORS.green },
              { key: "A3", name: "Apuesta 3", color: COLORS.orange },
            ];
            return (
              <>
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
                  {[0, 25, 50, 75, 100].map((g) => {
                    const y = yFor(g);
                    return (
                      <g key={`tg-${g}`}>
                        <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#F3F4F6" strokeWidth={1} />
                        <text x={padL - 4} y={y + 3} fontSize={9} fill="#9CA3AF" textAnchor="end">{g}</text>
                      </g>
                    );
                  })}
                  {trendData.map((d, i) => (
                    <text key={`tx-${d.corte}`} x={xFor(i)} y={H - padB + 14} fontSize={9} fill="#9CA3AF" textAnchor="middle">{d.corte}</text>
                  ))}
                  {series.map((s) => {
                    const path = trendData.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d[s.key])}`).join(" ");
                    return (
                      <g key={`s-${s.key}`}>
                        <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} />
                        {trendData.map((d, i) => (
                          <circle key={`c-${s.key}-${i}`} cx={xFor(i)} cy={yFor(d[s.key])} r={3} fill={s.color} />
                        ))}
                      </g>
                    );
                  })}
                </svg>
                <div className="flex gap-3 justify-center mt-2">
                  {series.map((s) => (
                    <div key={`leg-${s.key}`} className="flex items-center gap-1">
                      <span style={{ width: 10, height: 10, backgroundColor: s.color, borderRadius: 2, display: "inline-block" }} />
                      <span style={{ fontSize: 10, color: "#374151" }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* Dept table */}
        <div
          className="bg-white rounded-lg p-5"
          style={{ border: "1.5px solid #E5E7EB" }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", marginBottom: 4 }}>
            Resumen por Departamento
          </h3>
          <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: 12 }}>Portafolio y cumplimiento</p>
          <div className="space-y-3">
            {deptData.map((d) => (
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#000" }}>{d.dept}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{d.proyectos} proy.</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: d.cumplimiento >= 60 ? COLORS.green : COLORS.orange }}>
                      {d.cumplimiento}%
                    </span>
                  </div>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#F3F4F6" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.cumplimiento}%`,
                      backgroundColor: d.cumplimiento >= 60 ? COLORS.green : COLORS.orange,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proyectos sin avance */}
      <div
        className="bg-white rounded-lg p-5"
        style={{ border: "1.5px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} color={COLORS.orange} />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>
            Proyectos que Requieren Atención
          </h3>
          <span
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: "#FEF3F2", color: COLORS.orange, fontSize: "10px", fontWeight: 700 }}
          >
            Sin avance reciente
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                {["Proyecto", "Departamento", "Tutor", "% Avance", "Días sin registro", "Estado"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 700, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proyectosSinAvance.map((p, i) => {
                const dias = diasSinRegistro(p.ultimoRegistro);
                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#000" }}>{p.nombre}</p>
                      <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{p.tipo}</p>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "12px", color: "#374151" }}>{p.departamento}</td>
                    <td style={{ padding: "10px 12px", fontSize: "12px", color: "#374151" }}>{p.tutores[0]}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#F3F4F6", minWidth: 60 }}>
                          <div
                            style={{
                              width: `${p.avanceGlobal}%`,
                              height: "100%",
                              backgroundColor: p.avanceGlobal > 50 ? COLORS.green : COLORS.orange,
                              borderRadius: 99,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#000", minWidth: 30 }}>{p.avanceGlobal}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: dias > 28 ? "#FEF3F2" : "#FFF9EC",
                          color: dias > 28 ? COLORS.orange : "#B45309",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {dias} días
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: COLORS.green + "20", color: COLORS.green, fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}
                      >
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apuestas estratégicas summary */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", marginBottom: 12 }}>
          Apuestas Estratégicas — Semáforo de Cumplimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {apuestas.map((a) => {
            const semaforo =
              a.cumplimiento >= 70 ? COLORS.green :
              a.cumplimiento >= 40 ? COLORS.yellow :
              COLORS.orange;
            const okrsApuesta = okrs.filter((o) => o.apuestaId === a.id);
            return (
              <div
                key={a.id}
                className="bg-white rounded-lg overflow-hidden"
                style={{ border: "1.5px solid #E5E7EB" }}
              >
                <div style={{ height: 6, backgroundColor: semaforo }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#000", lineHeight: 1.4 }}>{a.nombre}</h4>
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded"
                      style={{ backgroundColor: a.estado === "activa" ? "#ECFDF5" : "#F9FAFB", color: a.estado === "activa" ? COLORS.green : "#9CA3AF", fontSize: "10px", fontWeight: 600 }}
                    >
                      {a.estado}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Cumplimiento</span>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: semaforo }}>{a.cumplimiento}%</span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F3F4F6" }}>
                    <div
                      style={{ width: `${a.cumplimiento}%`, height: "100%", backgroundColor: semaforo, borderRadius: 99, transition: "width 1s" }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{a.areaInstitucional.split("·")[0]}</span>
                    <span style={{ fontSize: "10px", color: "#5454E9", fontWeight: 600 }}>{okrsApuesta.length} OKRs</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}