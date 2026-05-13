import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Filter, Download, Search, ChevronDown, ChevronUp,
  ExternalLink, Clock, CheckCircle2, PauseCircle, FileText, AlertCircle,
  Settings, Archive, XCircle, CheckSquare, Link2, Sparkles,
} from "lucide-react";
import {
  DEPARTAMENTOS, PERIODOS,
  getTipoProyectoLabel, diasSinRegistro,
  Proyecto, EstadoProyecto, TipoProyecto, ImpactoIA, OKR,
} from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { ImpactoIAPanel } from "../components/ImpactoIAPanel";

const ESTADOS: { value: string; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "activo", label: "Activo" },
  { value: "finalizado", label: "Finalizado" },
  { value: "borrador", label: "Borrador" },
  { value: "suspendido", label: "Suspendido" },
  { value: "archivado", label: "Archivado" },
];

const TIPOS: { value: string; label: string }[] = [
  { value: "todos", label: "Todos los tipos" },
  { value: "grado", label: "Proyecto de Grado" },
  { value: "investigacion", label: "Investigación" },
  { value: "extension", label: "Extensión" },
  { value: "macroproyecto", label: "Macroproyecto" },
];

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
};

type SortField = "nombre" | "avanceGlobal" | "ultimoRegistro" | "estado";

function EstadoBadge({ estado }: { estado: EstadoProyecto }) {
  const map: Record<EstadoProyecto, { bg: string; color: string; icon: React.ReactNode }> = {
    activo: { bg: "#ECFDF5", color: "#065F46", icon: <CheckCircle2 size={10} /> },
    finalizado: { bg: "#EEF2FF", color: "#3730A3", icon: <CheckCircle2 size={10} /> },
    borrador: { bg: "#F9FAFB", color: "#374151", icon: <FileText size={10} /> },
    suspendido: { bg: "#FEF3F2", color: "#991B1B", icon: <PauseCircle size={10} /> },
    archivado: { bg: "#F3F4F6", color: "#9CA3AF", icon: <Archive size={10} /> },
  };
  const s = map[estado];
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.color, fontSize: "10px", fontWeight: 600, textTransform: "capitalize", width: "fit-content" }}>
      {s.icon}{estado}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: TipoProyecto }) {
  const colors: Record<TipoProyecto, string> = {
    grado: COLORS.blue,
    investigacion: COLORS.green,
    extension: COLORS.orange,
    macroproyecto: "#7C3AED",
  };
  return (
    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: colors[tipo] + "18", color: colors[tipo], fontSize: "10px", fontWeight: 600 }}>
      {getTipoProyectoLabel(tipo)}
    </span>
  );
}

// ── Vincular KR Modal ─────────────────────────────────────────────────────────
function VincularKRModal({ proyecto, onClose }: { proyecto: Proyecto; onClose: () => void }) {
  const { okrs: okrsCtx, setProyectoKR } = useData();
  const okrsDisponibles = okrsCtx.filter(o => o.estado === "activo" || o.estado === "borrador");

  const [selectedOkrId, setSelectedOkrId] = useState("");
  const [selectedKrId, setSelectedKrId] = useState(proyecto.krId || "");
  const [impactoKR, setImpactoKR] = useState<ImpactoIA | undefined>(proyecto.impactoKR);

  const okrSel = okrsDisponibles.find(o => o.id === selectedOkrId);
  const krSel = okrsCtx.flatMap(o => o.keyResults).find(k => k.id === selectedKrId);

  const handleOkrChange = (okrId: string) => {
    setSelectedOkrId(okrId);
    setSelectedKrId("");
    setImpactoKR(undefined);
  };

  const handleKrChange = (krId: string) => {
    setSelectedKrId(krId);
    setImpactoKR(undefined);
  };

  const handleVincular = () => {
    if (!selectedKrId) return;
    setProyectoKR(proyecto.id, selectedKrId, impactoKR);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ backgroundColor: "#000", padding: "18px 24px", flexShrink: 0 }} className="flex items-center justify-between">
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{proyecto.id}</p>
            <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 800 }}>Vincular KR al Proyecto</h3>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", marginTop: 2 }}>{proyecto.nombre}</p>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.5)", fontSize: "22px" }}>×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* KR actual */}
          {proyecto.krId && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "#F0FDF4", border: "1px solid #4CB97940" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "#065F46", textTransform: "uppercase", marginBottom: 2 }}>KR actual</p>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#000" }}>
                {okrsCtx.flatMap(o => o.keyResults).find(k => k.id === proyecto.krId)?.enunciado || proyecto.krId}
              </p>
            </div>
          )}

          {/* Selección Objetivo */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5, textTransform: "uppercase" }}>
              1. Selecciona el Objetivo
            </label>
            <select
              value={selectedOkrId}
              onChange={e => handleOkrChange(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
            >
              <option value="">-- Selecciona un Objetivo --</option>
              {okrsDisponibles.map(o => (
                <option key={o.id} value={o.id}>{o.id} · {o.objetivo} ({o.departamento})</option>
              ))}
            </select>
          </div>

          {/* Selección KR */}
          {okrSel && (
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5, textTransform: "uppercase" }}>
                2. Selecciona el KR <span style={{ color: COLORS.orange }}>*</span>
              </label>
              <div className="space-y-2">
                {okrSel.keyResults.map((kr, i) => {
                  const sel = selectedKrId === kr.id;
                  return (
                    <button
                      key={kr.id}
                      type="button"
                      onClick={() => handleKrChange(kr.id)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-lg transition-all"
                      style={{ border: `1.5px solid ${sel ? COLORS.green : "#E5E7EB"}`, backgroundColor: sel ? "#F0FDF4" : "#FAFAFA" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: sel ? COLORS.green : "#fff", border: `2px solid ${sel ? COLORS.green : "#D1D5DB"}` }}
                      >
                        {sel && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fff" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "#374151" }}>KR{i + 1} · {kr.id}</p>
                        <p style={{ fontSize: "12px", color: "#000", lineHeight: 1.4, marginTop: 1 }}>{kr.enunciado || kr.metrica}</p>
                        <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 2 }}>
                          {kr.valorBase} → {kr.valorObjetivo} {kr.unidad}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ImpactoIA Panel */}
          <ImpactoIAPanel
            titulo="Impacto del Proyecto en el KR"
            tipo="proyecto-kr"
            origen={{ titulo: proyecto.nombre, descripcion: proyecto.descripcion }}
            destino={krSel ? { titulo: krSel.enunciado || krSel.metrica } : null}
            value={impactoKR}
            onChange={setImpactoKR}
          />
        </div>

        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid #E5E7EB", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", fontWeight: 600 }}>Cancelar</button>
          <button
            disabled={!selectedKrId}
            onClick={handleVincular}
            className="flex items-center gap-2"
            style={{
              padding: "10px 20px",
              backgroundColor: selectedKrId ? COLORS.blue : "#E5E7EB",
              color: selectedKrId ? "#fff" : "#9CA3AF",
              borderRadius: 6, fontSize: "12px", fontWeight: 700,
              cursor: selectedKrId ? "pointer" : "not-allowed",
            }}
          >
            <Link2 size={14} /> Vincular KR
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ proyecto, okrs, onClose }: { proyecto: Proyecto; okrs: OKR[]; onClose: () => void }) {
  // Buscar KR único y su Objetivo padre
  const allKRsWithOkr = okrs.flatMap(o => o.keyResults.map(kr => ({ ...kr, okr: o })));
  const krDetail = allKRsWithOkr.find(k => k.id === proyecto.krId);
  const dias = diasSinRegistro(proyecto.ultimoRegistro);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-lg overflow-hidden shadow-2xl"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ backgroundColor: "#000", padding: "20px 24px" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <EstadoBadge estado={proyecto.estado} />
              <h2 style={{ color: "#fff", fontSize: "18px", fontWeight: 800, marginTop: 8, lineHeight: 1.3 }}>
                {proyecto.nombre}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: 4 }}>
                {proyecto.departamento} · {proyecto.tutores.join(", ")}
              </p>
            </div>
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.6)", fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* General info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Tipo</p>
              <TipoBadge tipo={proyecto.tipo} />
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Periodo</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#000" }}>{proyecto.fechaInicio} → {proyecto.fechaCierre}</p>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Contribución</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#000", textTransform: "capitalize" }}>{proyecto.contribucionTipo}</p>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Último registro</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: dias > 28 ? COLORS.orange : "#000" }}>
                {proyecto.ultimoRegistro} <span style={{ color: "#9CA3AF" }}>({dias} días)</span>
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6 }}>Descripción</p>
            <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{proyecto.descripcion}</p>
          </div>

          {/* Avance global */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#000" }}>Avance Global</p>
              <p style={{ fontSize: "18px", fontWeight: 800, color: COLORS.blue }}>{proyecto.avanceGlobal}%</p>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 10, backgroundColor: "#F3F4F6" }}>
              <div style={{ width: `${proyecto.avanceGlobal}%`, height: "100%", backgroundColor: proyecto.avanceGlobal > 70 ? COLORS.green : proyecto.avanceGlobal > 40 ? COLORS.blue : COLORS.orange, borderRadius: 99 }} />
            </div>
          </div>

          {/* KR Vinculado (único) */}
          <div>
            <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 8 }}>
              Resultado Clave (KR) Vinculado
            </p>
            {!proyecto.krId || !krDetail ? (
              <div className="flex items-center gap-2 p-3 rounded" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5" }}>
                <AlertCircle size={14} color={COLORS.orange} />
                <p style={{ fontSize: "12px", color: COLORS.orange }}>Este proyecto no tiene un KR vinculado</p>
              </div>
            ) : (
              <div>
                {/* Objetivo padre */}
                <div className="rounded-t-lg px-3 py-2" style={{ backgroundColor: "#000" }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {krDetail.okr.id} · {krDetail.okr.departamento} · {krDetail.okr.periodo}
                  </p>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: 2 }}>{krDetail.okr.objetivo}</p>
                </div>
                {/* KR específico */}
                <div className="rounded-b-lg p-3" style={{ backgroundColor: "#F0F4FF", border: "1px solid #C7D2FE", borderTop: "none" }}>
                  <div className="flex items-start gap-2">
                    <Sparkles size={13} color={COLORS.blue} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "10px", fontWeight: 700, color: COLORS.blue, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                        {krDetail.id}
                      </p>
                      <p style={{ fontSize: "12px", color: "#000", lineHeight: 1.5 }}>{krDetail.enunciado || krDetail.metrica}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <p style={{ fontSize: "11px", color: "#374151" }}>
                          {krDetail.valorActual} / {krDetail.valorObjetivo} {krDetail.unidad}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{
                            fontSize: "9px", fontWeight: 700,
                            backgroundColor: krDetail.estado === "superado" ? "#ECFDF5" : krDetail.estado === "en_riesgo" ? "#FEF3F2" : "#EEF2FF",
                            color: krDetail.estado === "superado" ? "#065F46" : krDetail.estado === "en_riesgo" ? "#991B1B" : "#3730A3",
                          }}
                        >
                          {krDetail.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Impacto IA si existe */}
                  {proyecto.impactoKR && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid #C7D2FE" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: 4 }}>
                        Impacto estimado (IA)
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#E5E7EB" }}>
                          <div style={{
                            width: `${proyecto.impactoKR.porcentaje}%`, height: "100%", borderRadius: 99,
                            backgroundColor: proyecto.impactoKR.porcentaje >= 50 ? COLORS.green : proyecto.impactoKR.porcentaje >= 30 ? COLORS.blue : COLORS.orange,
                          }} />
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: COLORS.blue, minWidth: 40, textAlign: "right" }}>
                          {proyecto.impactoKR.porcentaje}%
                        </span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#717182", lineHeight: 1.5, marginTop: 4 }}>{proyecto.impactoKR.justificacion}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
            Cerrar
          </button>
          <button className="px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: "#5454E9", color: "#fff", fontSize: "12px", fontWeight: 600 }}>
            <Download size={13} /> Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export function Proyectos() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { proyectos, okrs, updateProyecto } = useData();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterDepto, setFilterDepto] = useState("todos");
  const [filterTutor, setFilterTutor] = useState("todos");
  const [filterOKR, setFilterOKR] = useState("todos");
  const [filterPeriodo, setFilterPeriodo] = useState("todos");
  const [sortField, setSortField] = useState<SortField>("avanceGlobal");
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Proyecto | null>(null);
  const [gestionMenuId, setGestionMenuId] = useState<string | null>(null);
  const [vincularKRProyecto, setVincularKRProyecto] = useState<Proyecto | null>(null);

  const canCreate = usuario?.rol === "director" || usuario?.rol === "jefe" || usuario?.rol === "administrador";
  const canManage = usuario?.rol === "director" || usuario?.rol === "jefe" || usuario?.rol === "administrador";
  const tutoresOptions = Array.from(new Set(proyectos.flatMap(p => p.tutores))).sort();
  const okrsOptions = okrs.filter(o => o.estado === "activo" || o.estado === "completado" || o.estado === "borrador");

  const getOKRsProyecto = (p: Proyecto) => {
    const ids = new Set(p.okrIds);
    const okrFromKR = okrs.find(o => o.keyResults.some(kr => kr.id === p.krId));
    if (okrFromKR) ids.add(okrFromKR.id);
    return okrs.filter(o => ids.has(o.id));
  };

  const filtered = proyectos
    .filter((p) => {
      if (usuario?.rol === "tutor") return p.tutores.some((t) => t.includes(usuario.nombre.split(" ")[0]));
      if (usuario?.rol === "jefe") return p.departamento === usuario.departamento;
      return true;
    })
    .filter((p) => filterEstado === "todos" || p.estado === filterEstado)
    .filter((p) => filterTipo === "todos" || p.tipo === filterTipo)
    .filter((p) => filterDepto === "todos" || p.departamento === filterDepto)
    .filter((p) => filterTutor === "todos" || p.tutores.includes(filterTutor))
    .filter((p) => filterOKR === "todos" || getOKRsProyecto(p).some(o => o.id === filterOKR))
    .filter((p) => filterPeriodo === "todos" || p.periodoInicio === filterPeriodo || p.periodoFin === filterPeriodo)
    .filter((p) =>
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.tutores.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      p.departamento.toLowerCase().includes(search.toLowerCase()) ||
      getOKRsProyecto(p).some(o => o.objetivo.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let va: string | number = a[sortField] as string | number;
      let vb: string | number = b[sortField] as string | number;
      if (typeof va === "string" && typeof vb === "string") {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} color="#D1D5DB" />;

  const stats = {
    activos: filtered.filter((p) => p.estado === "activo").length,
    finalizados: filtered.filter((p) => p.estado === "finalizado").length,
    enRiesgo: filtered.filter((p) => p.estado === "activo" && diasSinRegistro(p.ultimoRegistro) > 28).length,
    okrsCubiertos: new Set(filtered.flatMap(p => getOKRsProyecto(p).map(o => o.id))).size,
  };

  return (
    <div className="p-6">
      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-5 flex-wrap">
        {[
          { label: "Activos", value: stats.activos, color: COLORS.green },
          { label: "Finalizados", value: stats.finalizados, color: COLORS.blue },
          { label: "En riesgo", value: stats.enRiesgo, color: COLORS.orange },
          { label: "OKRs cubiertos", value: stats.okrsCubiertos, color: "#7C3AED" },
          { label: "Total filtrado", value: filtered.length, color: "#000" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{s.label}</span>
            <div style={{ width: 1, height: 20, backgroundColor: "#E5E7EB", marginLeft: 8 }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1" style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 12px", minWidth: 200, maxWidth: 320 }}>
          <Search size={14} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proyecto, tutor..."
            style={{ border: "none", outline: "none", fontSize: "12px", flex: 1, backgroundColor: "transparent" }}
          />
        </div>
        {[
          { value: filterEstado, setter: setFilterEstado, options: ESTADOS },
          { value: filterTipo, setter: setFilterTipo, options: TIPOS },
        ].map((f, i) => (
          <select
            key={i}
            value={f.value}
            onChange={(e) => f.setter(e.target.value)}
            style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
          >
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <select
          value={filterTutor}
          onChange={(e) => setFilterTutor(e.target.value)}
          style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
        >
          <option value="todos">Todos los tutores</option>
          {tutoresOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterOKR}
          onChange={(e) => setFilterOKR(e.target.value)}
          style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff", maxWidth: 220 }}
        >
          <option value="todos">Todos los OKRs</option>
          {okrsOptions.map((o) => <option key={o.id} value={o.id}>{o.id} · {o.objetivo}</option>)}
        </select>
        <select
          value={filterPeriodo}
          onChange={(e) => setFilterPeriodo(e.target.value)}
          style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
        >
          <option value="todos">Todos los periodos</option>
          {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(usuario?.rol === "director" || usuario?.rol === "administrador") && (
          <select
            value={filterDepto}
            onChange={(e) => setFilterDepto(e.target.value)}
            style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
          >
            <option value="todos">Todos los deptos.</option>
            {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        <div className="flex-1" />
        <button className="flex items-center gap-1 px-3 py-2 rounded border hover:bg-gray-50 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
          <Download size={13} /> Exportar CSV
        </button>
        {canCreate && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}
            onClick={() => navigate("/proyectos/nuevo")}
          >
            <Plus size={14} />
            Nuevo Proyecto
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000", backgroundColor: "#000" }}>
                {[
                  { label: "Proyecto", field: "nombre" as SortField },
                  { label: "Tipo", field: null },
                  { label: "Departamento", field: null },
                  { label: "Tutor(es)", field: null },
                  { label: "Estado", field: "estado" as SortField },
                  { label: "OKRs / KR", field: null },
                  { label: "Avance", field: "avanceGlobal" as SortField },
                  { label: "Último registro", field: "ultimoRegistro" as SortField },
                  { label: "", field: null },
                ].map((h, i) => (
                  <th
                    key={i}
                    onClick={() => h.field && handleSort(h.field)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: h.field ? "pointer" : "default",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {h.label}
                      {h.field && <SortIcon field={h.field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const dias = diasSinRegistro(p.ultimoRegistro);
                const enRiesgo = dias > 28 && p.estado === "activo";
                const okrsProyecto = getOKRsProyecto(p);

                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/proyectos/${p.id}`)}
                    style={{
                      borderBottom: "1px solid #F3F4F6",
                      backgroundColor: enRiesgo ? "#FFFBEB" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                      cursor: "pointer",
                    }}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td style={{ padding: "12px 14px", maxWidth: 240 }}>
                      <div className="flex items-start gap-2">
                        {enRiesgo && <Clock size={12} color={COLORS.orange} className="flex-shrink-0 mt-0.5" />}
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: 700, color: "#000", lineHeight: 1.4 }}>{p.nombre}</p>
                          <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{p.periodoInicio}{p.periodoFin !== p.periodoInicio ? ` – ${p.periodoFin}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <TipoBadge tipo={p.tipo} />
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151", whiteSpace: "nowrap" }}>{p.departamento}</td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151" }}>
                      <div>
                        {p.tutores.map((t) => (
                          <div key={t} style={{ whiteSpace: "nowrap" }}>{t}</div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <EstadoBadge estado={p.estado} />
                    </td>
                    {/* OKRs y KR vinculados */}
                    <td style={{ padding: "12px 14px" }}>
                      {okrsProyecto.length === 0 ? (
                        <span style={{ fontSize: "10px", color: COLORS.orange }}>Sin OKR</span>
                      ) : (
                        <div className="flex flex-col gap-1" style={{ minWidth: 150 }}>
                          {okrsProyecto.slice(0, 2).map((okr) => (
                            <div key={okr.id} className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: "#EEF2FF", color: "#5454E9", fontSize: "9px", fontWeight: 800, width: "fit-content" }}>
                                {okr.id}
                              </span>
                              <span style={{ fontSize: "9px", color: "#717182", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {okr.objetivo}
                              </span>
                            </div>
                          ))}
                          {okrsProyecto.length > 2 && (
                            <span style={{ fontSize: "9px", color: "#9CA3AF", fontWeight: 700 }}>+{okrsProyecto.length - 2} OKR(s)</span>
                          )}
                          {p.krId && (
                            <span style={{ fontSize: "9px", color: "#374151", fontWeight: 700 }}>
                              KR principal: {p.krId}
                            </span>
                          )}
                          {p.impactoKR && (
                            <span style={{ fontSize: "9px", color: COLORS.green, fontWeight: 700 }}>
                              IA: {p.impactoKR.porcentaje}%
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full overflow-hidden" style={{ height: 6, width: 70, backgroundColor: "#F3F4F6" }}>
                          <div style={{
                            width: `${p.avanceGlobal}%`,
                            height: "100%",
                            backgroundColor: p.avanceGlobal >= 70 ? COLORS.green : p.avanceGlobal >= 40 ? COLORS.blue : COLORS.orange,
                            borderRadius: 99,
                          }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#000", minWidth: 30 }}>{p.avanceGlobal}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div className="flex items-center gap-1">
                        {enRiesgo && <AlertCircle size={11} color={COLORS.orange} />}
                        <span style={{ fontSize: "11px", color: enRiesgo ? COLORS.orange : "#374151", fontWeight: enRiesgo ? 700 : 400, whiteSpace: "nowrap" }}>
                          {p.ultimoRegistro}
                        </span>
                      </div>
                      <span style={{ fontSize: "9px", color: "#9CA3AF" }}>{dias}d atrás</span>
                    </td>
                    <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
                      {canManage ? (
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setGestionMenuId(gestionMenuId === p.id ? null : p.id); }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors"
                            style={{ fontSize: "11px", fontWeight: 600, color: "#374151", border: "1px solid #E5E7EB" }}
                          >
                            <Settings size={12} /> Gestionar
                          </button>
                          {gestionMenuId === p.id && (
                            <div
                              className="absolute right-0 top-full mt-1 rounded-lg shadow-xl z-50 overflow-hidden"
                              style={{ backgroundColor: "#fff", border: "1.5px solid #000", minWidth: 190 }}
                            >
                              {/* Vincular KR */}
                              <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                                <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>Jerarquía estratégica</p>
                              </div>
                              <button
                                onClick={() => { setVincularKRProyecto(p); setGestionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                                style={{ fontSize: "12px", color: COLORS.blue, fontWeight: 600 }}
                              >
                                <Link2 size={13} /> Vincular KR
                                {p.impactoKR && (
                                  <span className="ml-auto flex items-center gap-0.5" style={{ fontSize: "9px", color: COLORS.green }}>
                                    <Sparkles size={9} /> IA
                                  </span>
                                )}
                              </button>
                              {/* Estado del proyecto */}
                              <div className="px-3 py-2" style={{ borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6" }}>
                                <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>Estado del proyecto</p>
                              </div>
                              {[
                                { label: "Finalizar proyecto", estado: "finalizado" as EstadoProyecto, icon: <CheckSquare size={13} />, color: COLORS.blue },
                                { label: "Suspender proyecto", estado: "suspendido" as EstadoProyecto, icon: <PauseCircle size={13} />, color: COLORS.orange },
                                { label: "Archivar proyecto", estado: "archivado" as EstadoProyecto, icon: <Archive size={13} />, color: "#9CA3AF" },
                                { label: "Reactivar (Activo)", estado: "activo" as EstadoProyecto, icon: <CheckCircle2 size={13} />, color: COLORS.green },
                              ].filter(opt => opt.estado !== p.estado).map((opt) => (
                                <button
                                  key={opt.estado}
                                  onClick={() => { updateProyecto(p.id, { estado: opt.estado }); setGestionMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                  style={{ fontSize: "12px", color: opt.color, fontWeight: 600 }}
                                >
                                  {opt.icon} {opt.label}
                                </button>
                              ))}
                              <div style={{ borderTop: "1px solid #F3F4F6" }}>
                                <button
                                  onClick={() => { navigate(`/proyectos/${p.id}`); setGestionMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                  style={{ fontSize: "12px", color: COLORS.blue, fontWeight: 600 }}
                                >
                                  <ExternalLink size={13} /> Ver ficha completa
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/proyectos/${p.id}`)}
                          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                          style={{ color: "#5454E9", fontSize: "11px", fontWeight: 600 }}
                        >
                          <ExternalLink size={12} /> Ver ficha
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron proyectos con los filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && <DetailModal proyecto={selected} okrs={okrs} onClose={() => setSelected(null)} />}

      {/* Vincular KR modal */}
      {vincularKRProyecto && (
        <VincularKRModal
          proyecto={vincularKRProyecto}
          onClose={() => setVincularKRProyecto(null)}
        />
      )}

      {/* Close gestión menu on outside click */}
      {gestionMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setGestionMenuId(null)} />
      )}
    </div>
  );
}
