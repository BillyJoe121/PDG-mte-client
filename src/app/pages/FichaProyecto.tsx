import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, CheckCircle2, FileText, PauseCircle, Calendar,
  Users, Target, TrendingUp, Plus, ChevronRight,
  AlertCircle, Download, Clock, Layers,
  Settings, Archive, CheckSquare, Edit2, Save,
} from "lucide-react";
import {
  getTipoProyectoLabel, diasSinRegistro, getColorEstadoProyecto,
  findOKRByKR, findKRById,
  EstadoProyecto, TipoProyecto, RegistroAvance, ImpactoIA, PERIODOS,
} from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { ImpactoIAPanel } from "../components/ImpactoIAPanel";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  black: "#000000",
  gray: "#717182",
};

function EstadoBadge({ estado }: { estado: EstadoProyecto }) {
  const map: Record<EstadoProyecto, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
    activo: { bg: "#ECFDF5", color: "#065F46", icon: <CheckCircle2 size={10} />, label: "Activo" },
    finalizado: { bg: "#EEF2FF", color: "#3730A3", icon: <CheckCircle2 size={10} />, label: "Finalizado" },
    borrador: { bg: "#F9FAFB", color: "#374151", icon: <FileText size={10} />, label: "Borrador" },
    suspendido: { bg: "#FEF3F2", color: "#991B1B", icon: <PauseCircle size={10} />, label: "Suspendido" },
    archivado: { bg: "#F3F4F6", color: "#6B7280", icon: <FileText size={10} />, label: "Archivado" },
  };
  const s = map[estado];
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded" style={{ backgroundColor: s.bg, color: s.color, fontSize: "11px", fontWeight: 700, width: "fit-content" }}>
      {s.icon} {s.label}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: TipoProyecto }) {
  const colors: Record<TipoProyecto, string> = {
    grado: COLORS.blue, investigacion: COLORS.green, extension: COLORS.orange, macroproyecto: "#7C3AED",
  };
  return (
    <span className="px-2.5 py-1 rounded" style={{ backgroundColor: colors[tipo] + "18", color: colors[tipo], fontSize: "11px", fontWeight: 700 }}>
      {getTipoProyectoLabel(tipo)}
    </span>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F3F4F6" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", backgroundColor: color, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ── SVG line chart (reemplazo de recharts) ─────────────────────────────────────
function EvolucionAvanceSVG({ data, color }: { data: { fecha: string; avance: number }[]; color: string }) {
  const W = 640, H = 200;
  const padL = 36, padR = 16, padT = 12, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;
  const xFor = (i: number) => padL + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const yFor = (v: number) => padT + innerH - (v / 100) * innerH;
  const pts = data.map((d, i) => `${xFor(i)},${yFor(d.avance)}`).join(" ");
  const meta70Y = yFor(70);
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", maxWidth: "100%" }} role="img" aria-label="Evolución del avance">
        {/* Grid + ticks Y */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={yFor(t)} y2={yFor(t)} stroke="#F3F4F6" strokeDasharray="3 3" />
            <text x={padL - 6} y={yFor(t) + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">{t}</text>
          </g>
        ))}
        {/* Línea meta 70 */}
        <line x1={padL} x2={W - padR} y1={meta70Y} y2={meta70Y} stroke={COLORS.green} strokeDasharray="4 4" />
        <text x={W - padR} y={meta70Y - 4} textAnchor="end" fontSize="9" fill={COLORS.green} fontWeight={700}>Meta 70%</text>
        {/* Polilínea */}
        {n > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {/* Puntos */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xFor(i)} cy={yFor(d.avance)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
            <title>{`${d.fecha}: ${d.avance}%`}</title>
          </g>
        ))}
        {/* Etiquetas X */}
        {data.map((d, i) => (
          <text key={i} x={xFor(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#9CA3AF">
            {d.fecha.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Modal registrar avance ─────────────────────────────────────────────────────
function RegistrarAvanceModal({ proyectoId, currentPct, userName, indicadorNombre, onClose, onSave }: {
  proyectoId: string; currentPct: number; userName: string; indicadorNombre?: string;
  onClose: () => void; onSave: (r: RegistroAvance) => void;
}) {
  const [pct, setPct] = useState(currentPct);
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split("T")[0]);
  const [comentario, setComentario] = useState("");
  const [hitoInput, setHitoInput] = useState("");
  const [hitos, setHitos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const diff = pct - currentPct;
  const progColor = pct >= 70 ? COLORS.green : pct >= 40 ? COLORS.blue : COLORS.orange;

  const addHito = () => { if (hitoInput.trim()) { setHitos([...hitos, hitoInput.trim()]); setHitoInput(""); } };

  const handleSave = () => {
    if (!comentario.trim()) { setError("Por favor ingresa un comentario de avance."); return; }
    onSave({
      id: `RA-${proyectoId}-${Date.now()}`,
      proyectoId, fecha: new Date().toISOString().split("T")[0],
      fechaCorte,
      porcentaje: pct,
      indicadorNombre: indicadorNombre || "Avance global del proyecto",
      valorActual: pct,
      comentario: comentario.trim(),
      observaciones: comentario.trim(),
      registradoPor: userName, hitos,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div style={{ backgroundColor: "#000", padding: "18px 24px" }} className="flex items-center justify-between">
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Registrar avance</p>
            <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 800, marginTop: 2 }}>Nuevo registro de progreso</h3>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.5)", fontSize: "22px" }}>×</button>
        </div>
        <div className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded flex items-center gap-2" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5" }}>
              <AlertCircle size={13} color={COLORS.orange} />
              <p style={{ fontSize: "12px", color: "#991B1B" }}>{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6 }}>Fecha de corte</label>
              <input type="date" value={fechaCorte} onChange={e => setFechaCorte(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6 }}>Indicador</label>
              <div style={{ minHeight: 36, padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", color: "#374151", backgroundColor: "#F9FAFB" }}>
                {indicadorNombre || "Avance global del proyecto"}
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 8 }}>
              Valor actual / porcentaje de avance: <span style={{ color: progColor, fontSize: "18px" }}>{pct}%</span>
              {diff !== 0 && <span style={{ fontSize: "12px", color: diff > 0 ? COLORS.green : COLORS.orange, marginLeft: 8 }}>({diff > 0 ? "+" : ""}{diff}%)</span>}
            </label>
            <div className="flex items-center gap-4">
              <input type="range" min={0} max={100} value={pct} onChange={e => setPct(Number(e.target.value))} style={{ flex: 1, accentColor: progColor }} />
              <input type="number" min={0} max={100} value={pct} onChange={e => setPct(Math.min(100, Math.max(0, Number(e.target.value))))} style={{ width: 60, padding: "4px 8px", border: "1.5px solid #000", borderRadius: 4, fontSize: "13px", textAlign: "center", outline: "none" }} />
            </div>
            <div className="mt-2"><ProgressBar value={pct} color={progColor} /></div>
            <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 4 }}>El porcentaje puede subir o bajar respecto al registro anterior.</p>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6 }}>Comentario <span style={{ color: COLORS.orange }}>*</span></label>
            <textarea rows={3} value={comentario} onChange={e => { setComentario(e.target.value); setError(""); }} placeholder="Describe lo que se avanzó, retrocesos, logros, decisiones..." style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", resize: "vertical", outline: "none", fontFamily: "Montserrat, sans-serif", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6 }}>Hitos alcanzados (opcional)</label>
            <div className="flex gap-2">
              <input value={hitoInput} onChange={e => setHitoInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHito(); } }} placeholder="Ej: Módulo completado" style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none" }} />
              <button onClick={addHito} style={{ padding: "8px 14px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>+ Agregar</button>
            </div>
            {hitos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hitos.map((h, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ backgroundColor: "#ECFDF5", color: "#065F46", fontSize: "11px", fontWeight: 600 }}>
                    <CheckCircle2 size={10} />{h}<button onClick={() => setHitos(hitos.filter((_, j) => j !== i))} style={{ color: "#9CA3AF", marginLeft: 2 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "12px 14px", backgroundColor: "#F9FAFB", borderRadius: 6, border: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 700 }}>Registrado por</p>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#000", marginTop: 2 }}>{userName}</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", fontWeight: 600 }}>Cancelar</button>
          <button onClick={handleSave} style={{ padding: "10px 20px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>Guardar registro</button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline entry ─────────────────────────────────────────────────────────────
function TimelineEntry({ registro, isLast, isFirst }: { registro: RegistroAvance; isLast: boolean; isFirst: boolean }) {
  const color = registro.porcentaje >= 70 ? COLORS.green : registro.porcentaje >= 40 ? COLORS.blue : COLORS.orange;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
        <div className="flex items-center justify-center rounded-full z-10" style={{ width: 28, height: 28, backgroundColor: isFirst ? "#000" : color + "18", border: `2px solid ${isFirst ? "#000" : color}`, flexShrink: 0 }}>
          {isFirst ? <TrendingUp size={11} color="#fff" /> : <span style={{ fontSize: "9px", fontWeight: 800, color }}>{registro.porcentaje}%</span>}
        </div>
        {!isLast && <div style={{ flex: 1, width: 2, backgroundColor: "#E5E7EB", marginTop: 4 }} />}
      </div>
      <div className="pb-6 flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#000" }}>{registro.porcentaje}% de avance</span>
            {isFirst && <span style={{ fontSize: "9px", backgroundColor: "#E4EB60", color: "#000", padding: "2px 6px", borderRadius: 3, fontWeight: 700 }}>ÚLTIMO</span>}
          </div>
          <div className="flex items-center gap-1" style={{ color: "#9CA3AF" }}>
            <Calendar size={11} /><span style={{ fontSize: "10px" }}>{registro.fecha}</span>
          </div>
        </div>
        <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: 6 }}>Registrado por <strong style={{ color: "#374151" }}>{registro.registradoPor}</strong></p>
        {(registro.fechaCorte || registro.indicadorNombre) && (
          <p style={{ fontSize: "10px", color: "#717182", marginBottom: 6 }}>
            {registro.indicadorNombre ?? "Indicador"}{registro.fechaCorte ? ` · Corte ${registro.fechaCorte}` : ""}{registro.valorActual != null ? ` · Valor ${registro.valorActual}%` : ""}
          </p>
        )}
        <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.6 }}>{registro.comentario}</p>
        {registro.hitos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {registro.hitos.map((h, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: "#ECFDF5", color: "#065F46", fontSize: "10px", fontWeight: 600 }}>
                <Award size={9} /> {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function FichaProyecto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { proyectos, okrs, updateProyecto, addRegistroAvance, getRegistrosByProyecto } = useData();

  const [activeTab, setActiveTab] = useState<"resumen" | "historial" | "kr">("resumen");
  const [showModal, setShowModal] = useState(false);
  const [showGestion, setShowGestion] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editPeriodoFin, setEditPeriodoFin] = useState("");

  const proyecto = proyectos.find(p => p.id === id);

  if (!proyecto) {
    return (
      <div className="p-8 text-center">
        <p style={{ fontSize: "16px", color: "#9CA3AF" }}>Proyecto no encontrado.</p>
        <button onClick={() => navigate("/proyectos")} className="mt-4" style={{ color: COLORS.blue, fontSize: "13px", fontWeight: 600 }}>Volver a proyectos</button>
      </div>
    );
  }

  const userFirstName = usuario?.nombre.split(" ")[0].toLowerCase() ?? "";
  const canView =
    usuario?.rol === "administrador" ||
    usuario?.rol === "director" ||
    (usuario?.rol === "jefe" && proyecto.departamento === usuario.departamento) ||
    (usuario?.rol === "tutor" && proyecto.tutores.some(t => t.toLowerCase().includes(userFirstName)));

  if (!canView) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={32} color={COLORS.orange} className="mx-auto mb-3" />
        <p style={{ fontSize: "16px", color: "#000", fontWeight: 700 }}>No tienes acceso a esta ficha.</p>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: 4 }}>Solo direcciÃ³n, jefaturas del departamento y tutores asignados pueden consultar el detalle.</p>
        <button onClick={() => navigate("/proyectos")} className="mt-4" style={{ color: COLORS.blue, fontSize: "13px", fontWeight: 600 }}>Volver a proyectos</button>
      </div>
    );
  }

  // Registros reactivos: provienen del DataContext (persisten entre navegaciones)
  const allRegistros = getRegistrosByProyecto(id!)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const krProyecto = proyecto.krId ? findKRById(okrs, proyecto.krId) : undefined;
  const okrPadre = proyecto.krId ? findOKRByKR(okrs, proyecto.krId) : undefined;
  const okrIdsProyecto = new Set<string>(proyecto.okrIds ?? []);
  if (okrPadre) okrIdsProyecto.add(okrPadre.id);
  const okrsProyecto = okrs.filter(o =>
    okrIdsProyecto.has(o.id) ||
    o.keyResults.some(kr => kr.proyectoIds.includes(proyecto.id))
  );
  const getKRsProyectoEnOKR = (okr: typeof okrs[number]) =>
    okr.keyResults.filter(kr => kr.id === proyecto.krId || kr.proyectoIds.includes(proyecto.id));
  const indicadoresProyecto = Array.from(new Set([
    ...allRegistros.map(r => r.indicadorNombre).filter((v): v is string => Boolean(v)),
    ...(krProyecto ? [krProyecto.metrica] : []),
  ]));
  const dias = diasSinRegistro(proyecto.ultimoRegistro);
  const canRegister = proyecto.estado === "activo";
  const canManage = usuario?.rol === "director" || usuario?.rol === "jefe" || usuario?.rol === "administrador";
  const currentPct = allRegistros.length > 0 ? allRegistros[0].porcentaje : proyecto.avanceGlobal;
  const progColor = currentPct >= 70 ? COLORS.green : currentPct >= 40 ? COLORS.blue : COLORS.orange;

  const chartData = getRegistrosByProyecto(id!)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map(r => ({ fecha: r.fecha, avance: r.porcentaje }));

  const handleSaveRegistro = (registro: RegistroAvance) => {
    addRegistroAvance(registro);
    updateProyecto(id!, { avanceGlobal: registro.porcentaje, ultimoRegistro: registro.fecha });
    setShowModal(false);
  };

  const handleCambiarEstado = (estado: EstadoProyecto) => {
    updateProyecto(id!, { estado });
    setShowGestion(false);
  };

  const handleGuardarPeriodoFin = () => {
    if (editPeriodoFin) updateProyecto(id!, { periodoFin: editPeriodoFin });
    setEditando(false);
  };

  const handleImpactoChange = (impacto: ImpactoIA | undefined) => {
    updateProyecto(id!, { impactoKR: impacto });
  };

  const impactoPct = proyecto.impactoKR?.porcentaje ?? 0;
  const aporteReal = Math.round((currentPct / 100) * impactoPct);

  const TABS = [
    { key: "resumen", label: "Resumen" },
    { key: "historial", label: `Historial (${allRegistros.length})` },
    { key: "kr", label: okrsProyecto.length > 0 ? `Estrategia (${okrsProyecto.length})` : "Sin OKR" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate("/proyectos")} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity" style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 500 }}>
          <ArrowLeft size={14} /> Proyectos
        </button>
        <ChevronRight size={12} color="#D1D5DB" />
        <span style={{ fontSize: "12px", color: "#000", fontWeight: 600 }}>{proyecto.nombre}</span>
      </div>

      {/* Project header */}
      <div className="bg-white rounded-xl mb-5" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ height: 6, backgroundColor: getColorEstadoProyecto(proyecto.estado), borderRadius: "10px 10px 0 0" }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <EstadoBadge estado={proyecto.estado} />
                <TipoBadge tipo={proyecto.tipo} />
                <span style={{ fontSize: "10px", color: "#9CA3AF", padding: "3px 8px", backgroundColor: "#F3F4F6", borderRadius: 4, fontWeight: 600, textTransform: "capitalize" }}>
                  Contribución {proyecto.contribucionTipo}
                </span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#000", lineHeight: 1.3, marginBottom: 6 }}>{proyecto.nombre}</h1>
              <p style={{ fontSize: "13px", color: "#717182", lineHeight: 1.6 }}>{proyecto.descripcion}</p>
            </div>

            {/* Avance + botones */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div className="text-center px-6 py-4 rounded-lg" style={{ backgroundColor: progColor + "10", border: `1.5px solid ${progColor}30` }}>
                <p style={{ fontSize: "40px", fontWeight: 900, color: progColor, lineHeight: 1 }}>{currentPct}%</p>
                <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>Avance global</p>
                <div className="mt-3" style={{ width: 120 }}><ProgressBar value={currentPct} color={progColor} /></div>
              </div>

              <div className="flex gap-2 w-full">
                {canRegister && (
                  <button onClick={() => setShowModal(true)} className="flex-1 flex items-center justify-center gap-1 hover:opacity-90 transition-opacity" style={{ padding: "8px 12px", backgroundColor: "#000", color: "#fff", borderRadius: 6, fontSize: "11px", fontWeight: 700 }}>
                    <Plus size={12} /> Registrar avance
                  </button>
                )}
                <button className="flex items-center justify-center gap-1 hover:opacity-90 transition-opacity" style={{ padding: "8px 12px", backgroundColor: "#F3F4F6", color: "#374151", borderRadius: 6, fontSize: "11px", fontWeight: 700, border: "1px solid #E5E7EB" }}>
                  <Download size={12} /> PDF
                </button>
                {canManage && (
                  <div className="relative">
                    <button
                      onClick={() => setShowGestion(!showGestion)}
                      className="flex items-center gap-1 hover:opacity-90 transition-opacity"
                      style={{ padding: "8px 12px", backgroundColor: showGestion ? COLORS.orange : COLORS.blue, color: "#fff", borderRadius: 6, fontSize: "11px", fontWeight: 700 }}
                    >
                      <Settings size={12} /> Gestionar
                    </button>
                    {showGestion && (
                      <div
                        className="fixed rounded-lg shadow-xl overflow-hidden"
                        style={{ backgroundColor: "#fff", border: "1.5px solid #000", minWidth: 200, zIndex: 9999 }}
                      >
                        <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>Estado del proyecto</p>
                        </div>
                        {([
                          { label: "Reactivar (Activo)", estado: "activo" as EstadoProyecto, color: COLORS.green, icon: <CheckCircle2 size={13} /> },
                          { label: "Finalizar proyecto", estado: "finalizado" as EstadoProyecto, color: COLORS.blue, icon: <CheckSquare size={13} /> },
                          { label: "Suspender proyecto", estado: "suspendido" as EstadoProyecto, color: COLORS.orange, icon: <PauseCircle size={13} /> },
                          { label: "Archivar proyecto", estado: "archivado" as EstadoProyecto, color: "#9CA3AF", icon: <Archive size={13} /> },
                        ] as const).filter(opt => opt.estado !== proyecto.estado).map(opt => (
                          <button
                            key={opt.estado}
                            onClick={() => handleCambiarEstado(opt.estado)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            style={{ fontSize: "12px", color: opt.color, fontWeight: 600 }}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                        <div style={{ borderTop: "1px solid #F3F4F6" }}>
                          <button
                            onClick={() => { setEditando(true); setEditPeriodoFin(proyecto.periodoFin); setShowGestion(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            style={{ fontSize: "12px", color: "#374151", fontWeight: 600 }}
                          >
                            <Edit2 size={13} /> Editar periodo de cierre
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editar periodo fin */}
          {editando && (
            <div className="mt-4 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#000" }}>Periodo de cierre:</p>
              <select
                value={editPeriodoFin}
                onChange={e => setEditPeriodoFin(e.target.value)}
                style={{ padding: "6px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", fontWeight: 600, fontFamily: "Montserrat, sans-serif" }}
              >
                {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={handleGuardarPeriodoFin} className="flex items-center gap-1" style={{ padding: "6px 14px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>
                <Save size={12} /> Guardar
              </button>
              <button onClick={() => setEditando(false)} style={{ padding: "6px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px", color: "#9CA3AF" }}>
                Cancelar
              </button>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5" style={{ borderTop: "1px solid #F3F4F6" }}>
            {[
              { icon: Layers, label: "Departamento", value: proyecto.departamento },
              { icon: Users, label: "Tutor(es)", value: proyecto.tutores.join(", ") },
              { icon: Calendar, label: "Periodo", value: `${proyecto.periodoInicio}${proyecto.periodoFin !== proyecto.periodoInicio ? ` → ${proyecto.periodoFin}` : ""}` },
              { icon: Clock, label: "Último registro", value: proyecto.ultimoRegistro, sub: `${dias} días atrás`, warn: dias > 28 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon size={12} color="#9CA3AF" />
                  <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                </div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: item.warn ? COLORS.orange : "#000" }}>{item.value}</p>
                {item.sub && <p style={{ fontSize: "10px", color: item.warn ? COLORS.orange : "#9CA3AF" }}>{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-5 bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB", width: "fit-content" }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{ padding: "10px 20px", fontSize: "12px", fontWeight: 700, backgroundColor: activeTab === tab.key ? "#000" : "#fff", color: activeTab === tab.key ? "#fff" : "#717182", borderRight: "1px solid #E5E7EB", transition: "all 0.15s" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Resumen ── */}
      {activeTab === "resumen" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "OKRs vinculados", value: okrsProyecto.length, color: COLORS.blue, icon: Layers },
              { label: "Impacto evaluado", value: `${impactoPct}%`, color: "#7C3AED", icon: Target },
              { label: "Registros de avance", value: allRegistros.length, color: COLORS.green, icon: TrendingUp },
              { label: "Días sin registro", value: dias, color: dias > 28 ? COLORS.orange : COLORS.gray, icon: Clock },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
                <div className="flex items-center justify-between mb-2"><kpi.icon size={16} color={kpi.color} /><span style={{ fontSize: "24px", fontWeight: 800, color: kpi.color }}>{kpi.value}</span></div>
                <p style={{ fontSize: "11px", color: "#717182", fontWeight: 500 }}>{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Cadena de propagación visual (single KR) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#000", marginBottom: 12 }}>OKRs vinculados</h3>
              {okrsProyecto.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Este proyecto no tiene OKRs vinculados.</p>
              ) : (
                <div className="space-y-3">
                  {okrsProyecto.map(okr => (
                    <div key={okr.id} className="p-3 rounded-lg" style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E7EB" }}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span style={{ fontSize: "10px", fontWeight: 800, color: COLORS.blue }}>{okr.id} - {okr.departamento}</span>
                        <span style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 700 }}>{okr.periodo} - {okr.cumplimiento}%</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#000", fontWeight: 700, lineHeight: 1.4 }}>{okr.objetivo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#000", marginBottom: 12 }}>Indicadores de contribucion</h3>
              {indicadoresProyecto.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Aun no hay indicadores reportados para esta ficha.</p>
              ) : (
                <div className="space-y-2">
                  {indicadoresProyecto.map(indicador => {
                    const ultimo = allRegistros.find(r => r.indicadorNombre === indicador);
                    return (
                      <div key={indicador} className="flex items-center justify-between gap-3 p-2 rounded" style={{ backgroundColor: "#FAFAFA" }}>
                        <span style={{ fontSize: "12px", color: "#374151", fontWeight: 600 }}>{indicador}</span>
                        <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 700 }}>
                          {ultimo?.valorActual ?? krProyecto?.valorActual ?? currentPct}{krProyecto?.unidad ? ` ${krProyecto.unidad}` : "%"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {krProyecto && (
            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#000", marginBottom: 4 }}>Cadena de Impacto Estimado</h3>
              <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: 16 }}>Avance del proyecto × Impacto sobre el KR = Aporte real</p>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E7EB" }}>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#000" }}>{currentPct}% avance</span>
                  <span style={{ fontSize: "10px", color: "#9CA3AF" }}>×</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: COLORS.blue }}>{impactoPct}% impacto</span>
                  <span style={{ fontSize: "10px", color: "#9CA3AF" }}>=</span>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: aporteReal >= 20 ? COLORS.green : aporteReal >= 10 ? COLORS.blue : COLORS.orange }}>
                    {aporteReal}% aporte a {krProyecto.id}
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "#374151", marginBottom: 6, lineHeight: 1.5 }}>{krProyecto.enunciado}</p>
                <div style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${aporteReal}%`, height: "100%", backgroundColor: aporteReal >= 20 ? COLORS.green : aporteReal >= 10 ? COLORS.blue : COLORS.orange, borderRadius: 99 }} />
                </div>
              </div>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#000", marginBottom: 4 }}>Evolución del Avance</h3>
              <EvolucionAvanceSVG data={chartData} color={progColor} />
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Historial ── */}
      {activeTab === "historial" && (
        <div>
          {canRegister && (
            <div className="flex items-center justify-between mb-5 p-4 rounded-lg" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#000" }}>Registrar nuevo avance</p>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>El porcentaje puede subir o bajar respecto al último registro.</p>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 hover:opacity-90 transition-opacity" style={{ padding: "10px 18px", backgroundColor: "#000", color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>
                <Plus size={14} /> Nuevo registro
              </button>
            </div>
          )}
          {allRegistros.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg" style={{ border: "1.5px dashed #E5E7EB" }}>
              <TrendingUp size={32} color="#E5E7EB" className="mx-auto mb-3" />
              <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No hay registros de avance para este proyecto.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6" style={{ border: "1.5px solid #E5E7EB" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Línea de tiempo de avances</h3>
                <button className="flex items-center gap-1.5" style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600 }}><Download size={12} /> Exportar</button>
              </div>
              {allRegistros.map((r, i) => <TimelineEntry key={r.id} registro={r} isFirst={i === 0} isLast={i === allRegistros.length - 1} />)}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: KR & Impacto ── */}
      {activeTab === "kr" && (
        <div className="space-y-4">
          {!krProyecto ? (
            <div className="py-12 text-center bg-white rounded-lg" style={{ border: "1.5px dashed #E5E7EB" }}>
              <Target size={32} color="#E5E7EB" className="mx-auto mb-3" />
              <p style={{ fontSize: "14px", color: "#9CA3AF" }}>Este proyecto aún no está vinculado a un KR.</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: 4 }}>Asigna un KR desde la edición del proyecto.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
                <div style={{ backgroundColor: "#000", padding: "14px 20px" }}>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase" }}>
                    Evaluacion de aporte estrategico
                  </span>
                  <p style={{ color: "#fff", fontSize: "14px", fontWeight: 700, marginTop: 4, lineHeight: 1.5 }}>
                    {currentPct}% avance del proyecto x {impactoPct}% impacto evaluado = {aporteReal}% aporte real
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginTop: 6, lineHeight: 1.4 }}>
                    Origen: {proyecto.impactoKR?.origen ?? "pendiente"}{proyecto.impactoKR?.calculadoEn ? ` - ${proyecto.impactoKR.calculadoEn}` : ""}
                  </p>
                </div>
                <div className="p-4">
                  <ProgressBar value={aporteReal} color={aporteReal >= 20 ? COLORS.green : aporteReal >= 10 ? COLORS.blue : COLORS.orange} />
                  {proyecto.impactoKR?.justificacion && (
                    <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5, marginTop: 10 }}>{proyecto.impactoKR.justificacion}</p>
                  )}
                </div>
              </div>

              {okrsProyecto.map(okr => {
                const krsVinculados = getKRsProyectoEnOKR(okr);
                return (
                  <div key={okr.id} className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
                    <div style={{ backgroundColor: "#FAFAFA", padding: "14px 18px", borderBottom: "1px solid #E5E7EB" }}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span style={{ fontSize: "10px", fontWeight: 800, color: COLORS.blue, textTransform: "uppercase" }}>
                          {okr.id} - {okr.departamento} - {okr.periodo}
                        </span>
                        <span style={{ fontSize: "11px", color: "#000", fontWeight: 800 }}>{okr.cumplimiento}% cumplimiento</span>
                      </div>
                      <p style={{ fontSize: "14px", color: "#000", fontWeight: 800, lineHeight: 1.4, marginTop: 4 }}>{okr.objetivo}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {(krsVinculados.length > 0 ? krsVinculados : okr.keyResults).map(kr => {
                        const pct = Math.round(((kr.valorActual - kr.valorBase) / Math.max(kr.valorObjetivo - kr.valorBase, 1)) * 100);
                        const krColor = kr.estado === "superado" ? COLORS.green : kr.estado === "en_riesgo" ? COLORS.orange : COLORS.blue;
                        const principal = kr.id === proyecto.krId;
                        return (
                          <div key={kr.id} className="p-3 rounded-lg" style={{ backgroundColor: principal ? "#EEF2FF" : "#FAFAFA", border: principal ? `1.5px solid ${COLORS.blue}` : "1px solid #E5E7EB" }}>
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span style={{ fontSize: "10px", color: principal ? COLORS.blue : "#9CA3AF", fontWeight: 800 }}>
                                {kr.id}{principal ? " - KR principal del proyecto" : ""}
                              </span>
                              <span style={{ fontSize: "11px", color: "#717182", fontWeight: 700 }}>{kr.valorActual} / {kr.valorObjetivo} {kr.unidad}</span>
                            </div>
                            <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5, marginBottom: 8 }}>{kr.enunciado}</p>
                            <ProgressBar value={Math.min(pct, 100)} color={krColor} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Tarjeta del KR */}
              <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
                <div style={{ backgroundColor: "#000", padding: "14px 20px" }}>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase" }}>
                    {krProyecto.id}
                    {okrPadre && ` · ${okrPadre.id} · ${okrPadre.departamento} · ${okrPadre.periodo}`}
                  </span>
                  <p style={{ color: "#fff", fontSize: "14px", fontWeight: 700, marginTop: 4, lineHeight: 1.5 }}>
                    {krProyecto.enunciado}
                  </p>
                  {okrPadre && (
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginTop: 6, lineHeight: 1.4 }}>
                      Objetivo: {okrPadre.objetivo}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Aporte real de este proyecto:</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: COLORS.yellow }}>{aporteReal}%</span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                      ({currentPct}% × {impactoPct}% impacto)
                    </span>
                  </div>
                </div>

                {/* Métrica del KR */}
                <div className="p-4">
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Métrica de seguimiento
                  </p>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: "12px", color: "#374151" }}>{krProyecto.metrica}</span>
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
                      {krProyecto.valorActual} / {krProyecto.valorObjetivo} {krProyecto.unidad}
                    </span>
                  </div>
                  {(() => {
                    const pct = Math.round(((krProyecto.valorActual - krProyecto.valorBase) / Math.max(krProyecto.valorObjetivo - krProyecto.valorBase, 1)) * 100);
                    const krColor = krProyecto.estado === "superado" ? COLORS.green : krProyecto.estado === "en_riesgo" ? COLORS.orange : COLORS.blue;
                    return <ProgressBar value={Math.min(pct, 100)} color={krColor} />;
                  })()}
                </div>
              </div>

              {/* Panel de impacto IA */}
              {canManage && (
                <ImpactoIAPanel
                  titulo="Impacto del proyecto sobre el KR"
                  tipo="proyecto-kr"
                  origen={{ titulo: proyecto.nombre, descripcion: proyecto.descripcion }}
                  destino={{ titulo: krProyecto.enunciado, descripcion: krProyecto.metrica }}
                  value={proyecto.impactoKR}
                  onChange={handleImpactoChange}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Modales */}
      {showModal && (
        <RegistrarAvanceModal
          proyectoId={id!}
          currentPct={currentPct}
          userName={usuario?.nombre ?? "Usuario"}
          indicadorNombre={krProyecto?.metrica}
          onClose={() => setShowModal(false)}
          onSave={handleSaveRegistro}
        />
      )}
      {showGestion && <div className="fixed inset-0 z-40" onClick={() => setShowGestion(false)} />}
    </div>
  );
}
