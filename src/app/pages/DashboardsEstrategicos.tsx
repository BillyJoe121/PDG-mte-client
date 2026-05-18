import { useMemo, useState } from "react";
import type React from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, BarChart3, Building2, Download, FileText, FolderKanban, Gauge, Layers, Target } from "lucide-react";
import { useData } from "../context/DataContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { useAudit } from "../context/AuditContext";
import { DEPARTAMENTOS, diasSinRegistro } from "../data/mockData";
import { buildExportFilename, downloadCSV, printPDF } from "../utils/exportUtils";
import { FilterPresetsBar } from "../components/FilterPresetsBar";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  purple: "#7C3AED",
  gray: "#717182",
};

type Tab = "okr" | "apuesta" | "departamento";

function Progress({ value, color }: { value: number; color: string }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F3F4F6" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", backgroundColor: color, borderRadius: 99 }} />
    </div>
  );
}

function Stat({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={16} color={color} />
        <span style={{ fontSize: "22px", fontWeight: 900, color }}>{value}</span>
      </div>
      <p style={{ fontSize: "11px", color: COLORS.gray }}>{label}</p>
    </div>
  );
}

export function DashboardsEstrategicos() {
  const navigate = useNavigate();
  const { okrs, proyectos, apuestas, metas, indicadoresContribucion, evaluacionesAporte, periodosAcademicos } = useData();
  const { filters, setFilter, clearFilters } = useGlobalFilters();
  const { logAudit } = useAudit();
  const [tab, setTab] = useState<Tab>("okr");
  const [selectedOkrId, setSelectedOkrId] = useState(filters.okrId !== "todos" ? filters.okrId : okrs[0]?.id ?? "");
  const [selectedApuestaId, setSelectedApuestaId] = useState(apuestas[0]?.id ?? "");
  const [selectedDepto, setSelectedDepto] = useState(filters.departamento !== "todos" ? filters.departamento : DEPARTAMENTOS[0]);

  const proyectosFiltrados = proyectos.filter((p) =>
    (filters.periodo === "todos" || p.periodoInicio === filters.periodo || p.periodoFin === filters.periodo) &&
    (filters.departamento === "todos" || p.departamento === filters.departamento) &&
    (filters.estadoProyecto === "todos" || p.estado === filters.estadoProyecto) &&
    (filters.okrId === "todos" || p.okrIds.includes(filters.okrId))
  );

  const okrsFiltrados = okrs.filter((o) =>
    (filters.periodo === "todos" || o.periodo === filters.periodo) &&
    (filters.departamento === "todos" || o.departamento === filters.departamento) &&
    (filters.okrId === "todos" || o.id === filters.okrId)
  );

  const selectedOkr = okrs.find(o => o.id === selectedOkrId) ?? okrsFiltrados[0] ?? okrs[0];
  const selectedApuesta = apuestas.find(a => a.id === selectedApuestaId) ?? apuestas[0];

  const okrProjects = selectedOkr
    ? proyectos.filter(p => p.okrIds.includes(selectedOkr.id))
    : [];
  const okrIndicators = selectedOkr
    ? indicadoresContribucion.filter(ind => ind.okrId === selectedOkr.id)
    : [];
  const okrEvaluations = selectedOkr
    ? evaluacionesAporte.filter(e => e.okrId === selectedOkr.id)
    : [];
  const okrContribution = okrEvaluations.length
    ? Math.round(okrEvaluations.reduce((s, e) => s + e.aportePonderado, 0) / okrEvaluations.length)
    : 0;

  const apuestaOkrs = selectedApuesta ? okrs.filter(o => o.apuestaId === selectedApuesta.id) : [];
  const apuestaOkrIds = new Set(apuestaOkrs.map(o => o.id));
  const apuestaProjects = proyectos.filter(p => p.okrIds.some(id => apuestaOkrIds.has(id)));
  const apuestaMetas = selectedApuesta ? metas.filter(m => m.apuestaIds?.includes(selectedApuesta.id) || apuestaOkrs.some(o => o.metaId === m.id)) : [];

  const deptOkrs = okrs.filter(o => o.departamento === selectedDepto);
  const deptProjects = proyectos.filter(p => p.departamento === selectedDepto);
  const deptIndicators = indicadoresContribucion.filter(ind => deptProjects.some(p => p.id === ind.proyectoId));

  const deptRows = useMemo(() => DEPARTAMENTOS.map(depto => {
    const dOkrs = okrsFiltrados.filter(o => o.departamento === depto);
    const dProjects = proyectosFiltrados.filter(p => p.departamento === depto);
    return {
      depto,
      okrs: dOkrs.length,
      proyectos: dProjects.length,
      activos: dProjects.filter(p => p.estado === "activo").length,
      riesgo: dProjects.filter(p => p.estado === "activo" && diasSinRegistro(p.ultimoRegistro) > 28).length,
      cumplimiento: dOkrs.length ? Math.round(dOkrs.reduce((s, o) => s + o.cumplimiento, 0) / dOkrs.length) : 0,
      cobertura: dOkrs.length ? Math.round((dOkrs.filter(o => o.proyectoIds.length > 0).length / dOkrs.length) * 100) : 0,
    };
  }), [okrsFiltrados, proyectosFiltrados]);

  const getExportRows = () => {
    if (tab === "okr" && selectedOkr) {
      return selectedOkr.keyResults.map((kr) => ({
        Vista: "OKR",
        Objetivo: selectedOkr.id,
        KR: kr.id,
        Metrica: kr.metrica,
        ValorActual: kr.valorActual,
        ValorObjetivo: kr.valorObjetivo,
        Unidad: kr.unidad,
        Estado: kr.estado,
        Proyectos: kr.proyectoIds.join(" | "),
      }));
    }

    if (tab === "apuesta" && selectedApuesta) {
      return apuestaOkrs.map((okr) => ({
        Vista: "Apuesta",
        Apuesta: selectedApuesta.nombre,
        OKR: okr.id,
        Objetivo: okr.objetivo,
        Meta: metas.find((meta) => meta.id === okr.metaId)?.nombre ?? "",
        Departamento: okr.departamento,
        Periodo: okr.periodo,
        Cumplimiento: okr.cumplimiento,
        Proyectos: proyectos.filter((project) => project.okrIds.includes(okr.id)).length,
      }));
    }

    return deptRows.map((row) => ({
      Vista: "Departamento",
      Departamento: row.depto,
      OKRs: row.okrs,
      Proyectos: row.proyectos,
      Activos: row.activos,
      CoberturaOKR: row.cobertura,
      Cumplimiento: row.cumplimiento,
      Riesgo: row.riesgo,
    }));
  };

  const handleExportCSV = () => {
    const rows = getExportRows();
    downloadCSV(rows, buildExportFilename("Dashboard_Estrategico", tab));
    logAudit({
      modulo: "Dashboard",
      accion: "Exportacion",
      entidad: `Dashboard estrategico ${tab}`,
      detalle: `${rows.length} filas exportadas con filtros aplicados.`,
      resultado: "info",
    });
  };

  const handlePrintPDF = () => {
    printPDF(`Dashboard estrategico ${tab}`);
    logAudit({
      modulo: "Dashboard",
      accion: "Exportacion PDF",
      entidad: `Dashboard estrategico ${tab}`,
      detalle: "Impresion/PDF generado desde dashboards estrategicos.",
      resultado: "info",
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Dashboards estrategicos</h1>
          <p style={{ fontSize: "12px", color: COLORS.gray, marginTop: 2 }}>
            Vistas analiticas por OKR, apuesta estrategica y departamento.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filters.periodo} onChange={e => setFilter("periodo", e.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
            <option value="todos">Todos los periodos</option>
            {periodosAcademicos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
          <select value={filters.departamento} onChange={e => setFilter("departamento", e.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
            <option value="todos">Todos los deptos.</option>
            {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={clearFilters} style={{ padding: "7px 12px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>
            Limpiar filtros
          </button>
          <button onClick={handlePrintPDF} className="flex items-center gap-2" style={{ padding: "7px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", fontWeight: 800 }}>
            <FileText size={13} /> PDF
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2" style={{ padding: "7px 12px", backgroundColor: "#000", color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 800 }}>
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      <FilterPresetsBar
        modulo="Dashboard"
        onPresetApplied={(nextFilters) => {
          if (nextFilters.okrId !== "todos") setSelectedOkrId(nextFilters.okrId);
          if (nextFilters.departamento !== "todos") setSelectedDepto(nextFilters.departamento);
        }}
      />

      <div className="flex items-center gap-0 bg-white rounded-lg overflow-hidden w-fit" style={{ border: "1.5px solid #000" }}>
        {[
          { key: "okr" as Tab, label: "Por OKR", icon: Target },
          { key: "apuesta" as Tab, label: "Por apuesta", icon: Layers },
          { key: "departamento" as Tab, label: "Por departamento", icon: Building2 },
        ].map(item => (
          <button key={item.key} onClick={() => setTab(item.key)} className="flex items-center gap-2" style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 800, backgroundColor: tab === item.key ? "#000" : "#fff", color: tab === item.key ? "#E4EB60" : "#374151", borderRight: "1px solid #000" }}>
            <item.icon size={13} /> {item.label}
          </button>
        ))}
      </div>

      {tab === "okr" && selectedOkr && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div className="min-w-0">
                <select value={selectedOkr.id} onChange={e => { setSelectedOkrId(e.target.value); setFilter("okrId", e.target.value); }} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 10px", fontSize: "12px", fontWeight: 800, backgroundColor: "#fff", maxWidth: 520 }}>
                  {okrsFiltrados.map(o => <option key={o.id} value={o.id}>{o.id} - {o.objetivo}</option>)}
                </select>
                <p style={{ fontSize: "13px", color: "#000", fontWeight: 800, marginTop: 12 }}>{selectedOkr.objetivo}</p>
                <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 2 }}>{selectedOkr.departamento} - {selectedOkr.periodo} - {selectedOkr.estado}</p>
              </div>
              <button onClick={() => navigate(`/okrs/${selectedOkr.id}/krs`)} style={{ padding: "8px 12px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 800 }}>
                Gestionar KRs
              </button>
            </div>
            <Progress value={selectedOkr.cumplimiento} color={selectedOkr.cumplimiento >= 70 ? COLORS.green : selectedOkr.cumplimiento >= 40 ? COLORS.blue : COLORS.orange} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Cumplimiento" value={`${selectedOkr.cumplimiento}%`} color={COLORS.blue} icon={Gauge} />
            <Stat label="KRs" value={selectedOkr.keyResults.length} color={COLORS.purple} icon={Target} />
            <Stat label="Proyectos" value={okrProjects.length} color={COLORS.green} icon={FolderKanban} />
            <Stat label="Indicadores" value={okrIndicators.length} color={COLORS.yellow} icon={BarChart3} />
            <Stat label="Aporte evaluado" value={`${okrContribution}%`} color={COLORS.orange} icon={TrendingIcon} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 900, color: "#000", marginBottom: 12 }}>KRs del objetivo</h3>
              <div className="space-y-3">
                {selectedOkr.keyResults.map(kr => {
                  const span = Math.max(kr.valorObjetivo - kr.valorBase, 1);
                  const pct = Math.min(100, Math.max(0, Math.round(((kr.valorActual - kr.valorBase) / span) * 100)));
                  const color = kr.estado === "superado" ? COLORS.green : kr.estado === "en_riesgo" ? COLORS.orange : COLORS.blue;
                  return (
                    <div key={kr.id} className="p-3 rounded" style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E7EB" }}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p style={{ fontSize: "12px", fontWeight: 800, color: "#000" }}>{kr.id} - {kr.metrica}</p>
                        <span style={{ fontSize: "12px", fontWeight: 900, color }}>{pct}%</span>
                      </div>
                      <p style={{ fontSize: "11px", color: COLORS.gray, marginBottom: 8 }}>{kr.valorActual} / {kr.valorObjetivo} {kr.unidad}</p>
                      <Progress value={pct} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 900, color: "#000", marginBottom: 12 }}>Proyectos por aporte</h3>
              <div className="space-y-2">
                {okrProjects.sort((a, b) => b.avanceGlobal - a.avanceGlobal).map(p => (
                  <button key={p.id} onClick={() => navigate(`/proyectos/${p.id}`)} className="w-full text-left p-3 rounded hover:bg-gray-50" style={{ border: "1px solid #E5E7EB" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p style={{ fontSize: "12px", fontWeight: 800, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</p>
                        <p style={{ fontSize: "10px", color: COLORS.gray }}>{p.departamento} - {p.estado}</p>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 900, color: p.avanceGlobal >= 70 ? COLORS.green : COLORS.orange }}>{p.avanceGlobal}%</span>
                    </div>
                  </button>
                ))}
                {okrProjects.length === 0 && <p style={{ fontSize: "12px", color: COLORS.gray }}>No hay proyectos vinculados.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "apuesta" && selectedApuesta && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <select value={selectedApuesta.id} onChange={e => setSelectedApuestaId(e.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 10px", fontSize: "12px", fontWeight: 800, backgroundColor: "#fff", maxWidth: 520 }}>
              {apuestas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <p style={{ fontSize: "13px", color: "#000", fontWeight: 800, marginTop: 12 }}>{selectedApuesta.descripcion}</p>
            <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 2 }}>{selectedApuesta.areaInstitucional}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Cumplimiento" value={`${selectedApuesta.cumplimiento}%`} color={COLORS.blue} icon={Gauge} />
            <Stat label="Metas vinculadas" value={apuestaMetas.length} color={COLORS.yellow} icon={Layers} />
            <Stat label="OKRs" value={apuestaOkrs.length} color={COLORS.purple} icon={Target} />
            <Stat label="Proyectos" value={apuestaProjects.length} color={COLORS.green} icon={FolderKanban} />
            <Stat label="En riesgo" value={apuestaProjects.filter(p => p.estado === "activo" && diasSinRegistro(p.ultimoRegistro) > 28).length} color={COLORS.orange} icon={AlertTriangle} />
          </div>

          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 900, color: "#000", marginBottom: 12 }}>Cadena apuesta - metas - OKRs - proyectos</h3>
            <div className="space-y-3">
              {apuestaMetas.map(meta => {
                const metaOkrs = apuestaOkrs.filter(o => o.metaId === meta.id);
                return (
                  <div key={meta.id} className="p-3 rounded" style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E7EB" }}>
                    <p style={{ fontSize: "12px", fontWeight: 900, color: "#000" }}>{meta.nombre}</p>
                    <div className="mt-2 space-y-2">
                      {metaOkrs.map(okr => {
                        const proy = proyectos.filter(p => p.okrIds.includes(okr.id));
                        return (
                          <button key={okr.id} onClick={() => navigate(`/okrs/${okr.id}/krs`)} className="w-full rounded p-2 text-left hover:bg-blue-50" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
                            <div className="flex items-center justify-between gap-3">
                              <span style={{ fontSize: "11px", fontWeight: 800, color: COLORS.blue }}>{okr.id} - {okr.objetivo}</span>
                              <span style={{ fontSize: "11px", fontWeight: 900, color: okr.cumplimiento >= 70 ? COLORS.green : COLORS.orange }}>{okr.cumplimiento}%</span>
                            </div>
                            <p style={{ fontSize: "10px", color: COLORS.gray, marginTop: 4 }}>{proy.length} proyectos vinculados</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "departamento" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <select value={selectedDepto} onChange={e => { setSelectedDepto(e.target.value); setFilter("departamento", e.target.value); }} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 10px", fontSize: "12px", fontWeight: 800, backgroundColor: "#fff" }}>
              {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="OKRs" value={deptOkrs.length} color={COLORS.blue} icon={Target} />
            <Stat label="Proyectos" value={deptProjects.length} color={COLORS.green} icon={FolderKanban} />
            <Stat label="Activos" value={deptProjects.filter(p => p.estado === "activo").length} color={COLORS.purple} icon={Gauge} />
            <Stat label="Indicadores" value={deptIndicators.length} color={COLORS.yellow} icon={BarChart3} />
            <Stat label="En riesgo" value={deptProjects.filter(p => p.estado === "activo" && diasSinRegistro(p.ultimoRegistro) > 28).length} color={COLORS.orange} icon={AlertTriangle} />
          </div>

          <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#000" }}>
                  {["Departamento", "OKRs", "Proyectos", "Activos", "Cobertura OKR", "Cumplimiento", "Riesgo"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#fff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptRows.map(row => (
                  <tr
                    key={row.depto}
                    onClick={() => {
                      setSelectedDepto(row.depto);
                      setFilter("departamento", row.depto);
                    }}
                    style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}
                    className="hover:bg-blue-50"
                  >
                    <td style={{ padding: "11px 12px", fontSize: "12px", fontWeight: 900, color: "#000" }}>{row.depto}</td>
                    <td style={{ padding: "11px 12px", fontSize: "12px", color: "#374151" }}>{row.okrs}</td>
                    <td style={{ padding: "11px 12px", fontSize: "12px", color: "#374151" }}>{row.proyectos}</td>
                    <td style={{ padding: "11px 12px", fontSize: "12px", color: "#374151" }}>{row.activos}</td>
                    <td style={{ padding: "11px 12px", minWidth: 130 }}><Progress value={row.cobertura} color={row.cobertura >= 70 ? COLORS.green : COLORS.orange} /></td>
                    <td style={{ padding: "11px 12px", minWidth: 130 }}><Progress value={row.cumplimiento} color={row.cumplimiento >= 70 ? COLORS.green : COLORS.blue} /></td>
                    <td style={{ padding: "11px 12px", fontSize: "12px", fontWeight: 900, color: row.riesgo > 0 ? COLORS.orange : COLORS.green }}>{row.riesgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingIcon(props: React.ComponentProps<typeof BarChart3>) {
  return <BarChart3 {...props} />;
}
