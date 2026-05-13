import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Target, ChevronDown, ChevronUp, Plus, Trash2,
  AlertTriangle, CheckCircle2, Circle, XCircle, Edit2, Save, X,
  Link2, FolderKanban, Settings,
} from "lucide-react";
import {
  historicoOKRs, DEPARTAMENTOS,
  OKR, EstadoOKR, Proyecto, KeyResult,
} from "../data/mockData";
// recharts removed — using pure SVG sparkline to avoid duplicate-null-key warning
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

// ── SVG Sparkline (sin recharts) ──────────────────────────────────────────────
function Sparkline({ data, color = "#5454E9" }: { data: { cumplimiento: number; periodo: string }[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const W = 280, H = 72, PAD = { top: 8, right: 4, bottom: 18, left: 26 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const vals = data.map((d) => d.cumplimiento);
  const minV = 0, maxV = 100;
  const xStep = iW / (data.length - 1);
  const toX = (i: number) => PAD.left + i * xStep;
  const toY = (v: number) => PAD.top + iH - ((v - minV) / (maxV - minV)) * iH;
  const points = data.map((d, i) => `${toX(i)},${toY(d.cumplimiento)}`).join(" ");
  const areaPoints = `${toX(0)},${toY(0)} ${points} ${toX(data.length - 1)},${toY(0)}`;
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* grid */}
      {gridLines.map((v) => (
        <line key={v} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#F3F4F6" strokeWidth={1} />
      ))}
      {/* y-axis labels */}
      {[0, 50, 100].map((v) => (
        <text key={v} x={PAD.left - 3} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="#9CA3AF">{v}</text>
      ))}
      {/* area fill */}
      <polygon points={areaPoints} fill={color} fillOpacity={0.08} />
      {/* line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      {/* dots + x-labels */}
      {data.map((d, i) => (
        <g key={`sp-${i}`}>
          <circle cx={toX(i)} cy={toY(d.cumplimiento)} r={2.5} fill={color} />
          <text x={toX(i)} y={H - 3} textAnchor="middle" fontSize={7} fill="#9CA3AF">{d.periodo}</text>
        </g>
      ))}
    </svg>
  );
}

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  black: "#000",
  gray: "#717182",
};

const ESTADOS_OKR: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activo" },
  { value: "borrador", label: "Borrador" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];

function EstadoOKRBadge({ estado }: { estado: EstadoOKR }) {
  const map: Record<EstadoOKR, { bg: string; color: string; icon: React.ReactNode }> = {
    activo: { bg: "#ECFDF5", color: "#065F46", icon: <CheckCircle2 size={10} /> },
    completado: { bg: "#EEF2FF", color: "#3730A3", icon: <CheckCircle2 size={10} /> },
    borrador: { bg: "#F9FAFB", color: "#374151", icon: <Circle size={10} /> },
    cancelado: { bg: "#FEF3F2", color: "#991B1B", icon: <XCircle size={10} /> },
  };
  const s = map[estado];
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.color, fontSize: "10px", fontWeight: 700, textTransform: "capitalize", width: "fit-content" }}>
      {s.icon}{estado}
    </span>
  );
}

function KRBar({ label, actual, objetivo, base, unidad, estado }: {
  label: string; actual: number; objetivo: number; base: number; unidad: string;
  estado: "normal" | "superado" | "en_riesgo";
}) {
  const pct = base === objetivo ? 100 : Math.min(Math.round(((actual - base) / (objetivo - base)) * 100), 100);
  const color = estado === "superado" ? COLORS.green : estado === "en_riesgo" ? COLORS.orange : COLORS.blue;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {estado === "superado" && <CheckCircle2 size={11} color={COLORS.green} className="flex-shrink-0" />}
          {estado === "en_riesgo" && <AlertTriangle size={11} color={COLORS.orange} className="flex-shrink-0" />}
          <p style={{ fontSize: "11px", color: "#374151", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
        </div>
        <p style={{ fontSize: "11px", fontWeight: 700, color, flexShrink: 0, marginLeft: 8 }}>{actual} / {objetivo} {unidad}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 7, backgroundColor: "#F3F4F6" }}>
          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 99 }} />
        </div>
        <span style={{ fontSize: "10px", fontWeight: 700, color, minWidth: 30, textAlign: "right" }}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Modal gestionar KRs ────────────────────────────────────────────────────────
function GestionarKRsModal({ okr, onClose, onSave }: {
  okr: OKR;
  onClose: () => void;
  onSave: (krs: KeyResult[]) => void;
}) {
  const [krs, setKrs] = useState<KeyResult[]>(okr.keyResults.map(kr => ({ ...kr })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KeyResult>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKR, setNewKR] = useState({ enunciado: "", metrica: "", valorBase: "0", valorObjetivo: "", unidad: "" });

  const startEdit = (kr: KeyResult) => {
    setEditingId(kr.id);
    setEditForm({ ...kr });
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setKrs(prev => prev.map(kr => kr.id === editingId ? { ...kr, ...editForm } as KeyResult : kr));
    setEditingId(null);
    setEditForm({});
  };

  const deleteKR = (id: string) => {
    setKrs(prev => prev.filter(kr => kr.id !== id));
    setConfirmDeleteId(null);
  };

  const addKR = () => {
    if (!newKR.enunciado.trim() || !newKR.valorObjetivo) return;
    const kr: KeyResult = {
      id: `KR-${Date.now()}`,
      enunciado: newKR.enunciado.trim(),
      metrica: newKR.metrica.trim() || newKR.enunciado.trim(),
      valorBase: Number(newKR.valorBase) || 0,
      valorActual: Number(newKR.valorBase) || 0,
      valorObjetivo: Number(newKR.valorObjetivo),
      unidad: newKR.unidad,
      estado: "normal",
      proyectoIds: [],
    };
    setKrs(prev => [...prev, kr]);
    setNewKR({ enunciado: "", metrica: "", valorBase: "0", valorObjetivo: "", unidad: "" });
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ backgroundColor: "#000", padding: "18px 24px", flexShrink: 0 }} className="flex items-center justify-between">
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{okr.id}</p>
            <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 800 }}>Gestionar Resultados Clave</h3>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.5)", fontSize: "22px" }}>×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {krs.map((kr) => (
            <div key={kr.id} className="rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
              {confirmDeleteId === kr.id ? (
                <div className="p-4" style={{ backgroundColor: "#FEF3F2" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B", marginBottom: 8 }}>
                    ¿Eliminar este Resultado Clave?
                  </p>
                  <p style={{ fontSize: "12px", color: "#374151", marginBottom: 12 }}>{kr.enunciado || kr.metrica}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDeleteId(null)} style={{ padding: "6px 16px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px", fontWeight: 600 }}>Cancelar</button>
                    <button onClick={() => deleteKR(kr.id)} style={{ padding: "6px 16px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>Eliminar</button>
                  </div>
                </div>
              ) : editingId === kr.id ? (
                <div className="p-4 space-y-3" style={{ backgroundColor: "#F9FAFB" }}>
                  {/* Enunciado */}
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>
                      Enunciado del KR <span style={{ color: COLORS.orange }}>*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.enunciado ?? kr.enunciado}
                      onChange={e => setEditForm(f => ({ ...f, enunciado: e.target.value }))}
                      placeholder="Sentencia completa que describe el resultado a lograr..."
                      style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Métrica (etiqueta corta)</label>
                    <input
                      value={editForm.metrica ?? kr.metrica}
                      onChange={e => setEditForm(f => ({ ...f, metrica: e.target.value }))}
                      style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif" }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Valor base", field: "valorBase" as keyof KeyResult },
                      { label: "Valor actual", field: "valorActual" as keyof KeyResult },
                      { label: "Valor objetivo", field: "valorObjetivo" as keyof KeyResult },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>{label}</label>
                        <input
                          type="number"
                          value={editForm[field] as number ?? kr[field]}
                          onChange={e => setEditForm(f => ({ ...f, [field]: Number(e.target.value) }))}
                          style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Unidad</label>
                      <input
                        value={editForm.unidad ?? kr.unidad}
                        onChange={e => setEditForm(f => ({ ...f, unidad: e.target.value }))}
                        style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Estado</label>
                      <select
                        value={editForm.estado ?? kr.estado}
                        onChange={e => setEditForm(f => ({ ...f, estado: e.target.value as KeyResult["estado"] }))}
                        style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif" }}
                      >
                        <option value="normal">Normal</option>
                        <option value="superado">Superado</option>
                        <option value="en_riesgo">En riesgo</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditingId(null); setEditForm({}); }} style={{ padding: "6px 14px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px" }}>Cancelar</button>
                    <button onClick={saveEdit} className="flex items-center gap-1" style={{ padding: "6px 14px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>
                      <Save size={12} /> Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", lineHeight: 1.4 }}>{kr.enunciado || kr.metrica}</p>
                    <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 2 }}>
                      {kr.metrica && kr.metrica !== (kr.enunciado || kr.metrica) && <span className="mr-1">{kr.metrica} ·</span>}
                      Base {kr.valorBase} · Actual {kr.valorActual} · Objetivo {kr.valorObjetivo} {kr.unidad}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded" style={{
                      backgroundColor: kr.estado === "superado" ? "#ECFDF5" : kr.estado === "en_riesgo" ? "#FEF3F2" : "#EEF2FF",
                      color: kr.estado === "superado" ? "#065F46" : kr.estado === "en_riesgo" ? "#991B1B" : "#3730A3",
                      fontSize: "9px", fontWeight: 700,
                    }}>{kr.estado}</span>
                    <button onClick={() => startEdit(kr)} className="p-1.5 rounded hover:bg-gray-100" style={{ color: "#374151" }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(kr.id)} className="p-1.5 rounded hover:bg-red-50" style={{ color: COLORS.orange }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Agregar nuevo KR */}
          {showAddForm ? (
            <div className="rounded-lg p-4 space-y-3" style={{ border: `2px solid ${COLORS.blue}`, backgroundColor: "#F0F4FF" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: COLORS.blue, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nuevo KR</p>
              {/* Enunciado (obligatorio) */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>
                  Enunciado del KR <span style={{ color: COLORS.orange }}>*</span>
                </label>
                <textarea
                  rows={2}
                  value={newKR.enunciado}
                  onChange={e => setNewKR(f => ({ ...f, enunciado: e.target.value }))}
                  placeholder="Ej: Aumentar de 0 a 12 los syllabus actualizados con metodologías activas durante 2025-I."
                  style={{ width: "100%", padding: "7px 10px", border: `1.5px solid ${!newKR.enunciado.trim() ? COLORS.orange : "#000"}`, borderRadius: 6, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical" }}
                />
              </div>
              {/* Métrica opcional */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Métrica (etiqueta corta, opcional)</label>
                <input
                  value={newKR.metrica}
                  onChange={e => setNewKR(f => ({ ...f, metrica: e.target.value }))}
                  placeholder="Ej: Syllabus actualizados con metodologías activas"
                  style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Valor base", key: "valorBase" as const },
                  { label: "Valor objetivo *", key: "valorObjetivo" as const },
                  { label: "Unidad", key: "unidad" as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 3, textTransform: "uppercase" }}>{label}</label>
                    <input
                      type={key === "unidad" ? "text" : "number"}
                      value={newKR[key]}
                      onChange={e => setNewKR(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={key === "unidad" ? "Ej: artículos" : "0"}
                      style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddForm(false)} style={{ padding: "6px 14px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px" }}>Cancelar</button>
                <button onClick={addKR} className="flex items-center gap-1" style={{ padding: "6px 14px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>
                  <Plus size={12} /> Agregar KR
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              style={{ border: `1.5px dashed ${COLORS.blue}`, color: COLORS.blue, fontSize: "12px", fontWeight: 700 }}
            >
              <Plus size={14} /> Agregar nuevo KR
            </button>
          )}
        </div>

        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid #E5E7EB", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", fontWeight: 600 }}>Cancelar</button>
          <button
            onClick={() => { onSave(krs); onClose(); }}
            className="flex items-center gap-2"
            style={{ padding: "10px 20px", backgroundColor: "#000", color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}
          >
            <Save size={14} /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal vincular proyecto a OKR ──────────────────────────────────────────────
function VincularProyectoModal({ okr, proyectosDisponibles, onClose, onVincular, getVinculosByOKR }: {
  okr: OKR;
  proyectosDisponibles: Proyecto[];
  onClose: () => void;
  onVincular: (proyectoId: string, peso: number) => void;
  getVinculosByOKR: (okrId: string) => { proyectoId: string; peso: number }[];
}) {
  const [selectedProyecto, setSelectedProyecto] = useState("");
  const [peso, setPeso] = useState(30);
  const vinculos = getVinculosByOKR(okr.id);
  const sumaPesos = vinculos.reduce((s, v) => s + v.peso, 0);
  const superaLimite = sumaPesos + peso > 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div style={{ backgroundColor: "#000", padding: "18px 24px" }} className="flex items-center justify-between">
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase" }}>{okr.id}</p>
            <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 800 }}>Vincular Proyecto</h3>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.5)", fontSize: "22px" }}>×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Proyecto</label>
            <select value={selectedProyecto} onChange={e => setSelectedProyecto(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}>
              <option value="">-- Selecciona un proyecto --</option>
              {proyectosDisponibles.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.departamento})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5, textTransform: "uppercase" }}>
              Peso de contribución: <span style={{ color: COLORS.blue, fontSize: "16px" }}>{peso}%</span>
            </label>
            <p style={{ fontSize: "11px", color: "#717182", marginBottom: 8, lineHeight: 1.6 }}>
              ¿Qué % del avance total de este OKR cubrirá este proyecto al completarse?
            </p>
            <div className="flex items-center gap-3">
              <input type="range" min={5} max={100} step={5} value={peso} onChange={e => setPeso(Number(e.target.value))} style={{ flex: 1, accentColor: COLORS.blue }} />
              <input type="number" min={0} max={100} value={peso} onChange={e => setPeso(Math.min(100, Math.max(0, Number(e.target.value))))} style={{ width: 55, padding: "4px 8px", border: "1.5px solid #000", borderRadius: 4, fontSize: "13px", textAlign: "center", outline: "none" }} />
            </div>
            <div className="mt-2" style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${peso}%`, height: "100%", backgroundColor: COLORS.blue, borderRadius: 99 }} />
            </div>
          </div>
          {/* Resumen cobertura */}
          <div className="rounded-lg p-3" style={{ backgroundColor: superaLimite ? "#FEF3F2" : "#F9FAFB", border: `1px solid ${superaLimite ? "#FCA5A5" : "#E5E7EB"}` }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: superaLimite ? "#991B1B" : "#374151" }}>
              Cobertura actual: {sumaPesos}% → con este vínculo: {sumaPesos + peso}%
            </p>
            {superaLimite && <p style={{ fontSize: "10px", color: "#991B1B", marginTop: 4 }}>La suma supera el 100%. Ajusta el peso.</p>}
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", fontWeight: 600 }}>Cancelar</button>
          <button
            disabled={!selectedProyecto}
            onClick={() => { if (selectedProyecto) { onVincular(selectedProyecto, peso); onClose(); } }}
            style={{ padding: "9px 18px", backgroundColor: selectedProyecto ? COLORS.blue : "#E5E7EB", color: selectedProyecto ? "#fff" : "#9CA3AF", borderRadius: 6, fontSize: "12px", fontWeight: 700, cursor: selectedProyecto ? "pointer" : "not-allowed" }}
          >
            <Link2 size={13} className="inline mr-1" /> Vincular
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta OKR ────────────────────────────────────────────────────────────────
function OKRCard({ okr, expanded, onToggle, canEdit, proyectos }: {
  okr: OKR; expanded: boolean; onToggle: () => void; canEdit: boolean; proyectos: Proyecto[];
}) {
  const { objetivosCP, updateOKR, addVinculo, removeVinculo, updateVinculoPeso, getVinculosByOKR } = useData();
  const navigate = useNavigate();
  const ocp = objetivosCP.find((o) => o.id === okr.ocpId);
  const proy = proyectos.filter((p) => okr.proyectoIds.includes(p.id));
  const histData = historicoOKRs[okr.id];
  const cumplColor = okr.cumplimiento >= 70 ? COLORS.green : okr.cumplimiento >= 40 ? COLORS.blue : COLORS.orange;
  const alertaRiesgo = okr.cumplimiento < 30;
  const sinCobertura = proy.length === 0 && okr.estado === "activo";
  const vinculos = getVinculosByOKR(okr.id);
  const coberturaTotalPeso = vinculos.reduce((s, v) => s + v.peso, 0);

  // Edit state
  const [editando, setEditando] = useState(false);
  const [editObjetivo, setEditObjetivo] = useState(okr.objetivo);
  const [editEstado, setEditEstado] = useState(okr.estado);
  const [showVincularProyecto, setShowVincularProyecto] = useState(false);
  const [confirmDesvincular, setConfirmDesvincular] = useState<string | null>(null);
  const [editPesos, setEditPesos] = useState<Record<string, string>>({});

  const handleGuardar = () => {
    updateOKR(okr.id, { objetivo: editObjetivo, estado: editEstado });
    setEditando(false);
  };

  const handleSaveKRs = (krs: KeyResult[]) => {
    updateOKR(okr.id, { keyResults: krs });
  };

  const handleVincularProyecto = (proyectoId: string, peso: number) => {
    addVinculo({ proyectoId, okrId: okr.id, peso });
  };

  const handleDesvincular = (proyectoId: string) => {
    removeVinculo(proyectoId, okr.id);
    setConfirmDesvincular(null);
  };

  // Proyectos disponibles para vincular (no vinculados aún)
  const todosProyectos = proyectos;
  const proyectosDisponibles = todosProyectos.filter(p => !okr.proyectoIds.includes(p.id) && (p.estado === "activo" || p.estado === "borrador"));

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden mb-4" style={{ border: `2px solid ${sinCobertura || alertaRiesgo ? COLORS.orange : "#E5E7EB"}` }}>
        {alertaRiesgo && (
          <div className="px-4 py-1.5 flex items-center gap-2" style={{ backgroundColor: "#FEF3F2" }}>
            <AlertTriangle size={11} color={COLORS.orange} />
            <span style={{ fontSize: "10px", color: COLORS.orange, fontWeight: 700 }}>Bajo cumplimiento: menos del 30%</span>
          </div>
        )}

        {/* Edit panel */}
        {editando && (
          <div className="p-4 space-y-3" style={{ backgroundColor: "#F9FAFB", borderBottom: "1.5px solid #E5E7EB" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "#000", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Objetivo</label>
              <textarea
                value={editObjetivo}
                onChange={e => setEditObjetivo(e.target.value)}
                rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: "13px", resize: "vertical", outline: "none", fontFamily: "Montserrat, sans-serif" }}
              />
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#000", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Estado</label>
                <select value={editEstado} onChange={e => setEditEstado(e.target.value as EstadoOKR)} style={{ padding: "6px 12px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", fontFamily: "Montserrat, sans-serif" }}>
                  <option value="borrador">Borrador</option>
                  <option value="activo">Activo</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setEditando(false)} className="flex items-center gap-1" style={{ padding: "6px 14px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px", color: "#374151" }}>
                  <X size={12} /> Cancelar
                </button>
                <button onClick={handleGuardar} className="flex items-center gap-1" style={{ padding: "6px 14px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}>
                  <Save size={12} /> Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
          {/* Número + Ring */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#fff", backgroundColor: "#000", padding: "2px 6px", borderRadius: 3 }}>{okr.id}</span>
            <div className="relative" style={{ width: 52, height: 52 }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="20" fill="none" stroke="#F3F4F6" strokeWidth="5" />
                <circle cx="26" cy="26" r="20" fill="none" stroke={cumplColor} strokeWidth="5"
                  strokeDasharray={`${(okr.cumplimiento / 100) * 125.66} 125.66`}
                  strokeLinecap="round" transform="rotate(-90 26 26)"
                />
              </svg>
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "10px", fontWeight: 800, color: cumplColor }}>
                {okr.cumplimiento}%
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <EstadoOKRBadge estado={okr.estado} />
              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "#F9FAFB", color: "#374151", fontSize: "10px", fontWeight: 600 }}>{okr.departamento}</span>
              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "#EEF2FF", color: "#5454E9", fontSize: "10px", fontWeight: 600 }}>{okr.periodo}</span>
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", lineHeight: 1.4 }}>{okr.objetivo}</h3>
            {ocp && <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 3 }}>OCP: {ocp.nombre}</p>}
            <div className="flex items-center gap-4 mt-2">
              <span style={{ fontSize: "11px", color: "#374151" }}><strong>{okr.keyResults.length}</strong> KRs</span>
              <span style={{ fontSize: "11px", color: "#374151" }}><strong>{proy.length}</strong> proyectos</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: coberturaTotalPeso >= 80 ? COLORS.green : coberturaTotalPeso >= 50 ? COLORS.blue : COLORS.orange }}>
                Cobertura: {coberturaTotalPeso}%
              </span>
              {sinCobertura && <span style={{ fontSize: "10px", color: COLORS.orange, fontWeight: 700 }}>Sin cobertura</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditando(!editando); setEditObjetivo(okr.objetivo); setEditEstado(okr.estado); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors"
                style={{ border: "1px solid #E5E7EB", fontSize: "11px", color: "#374151", fontWeight: 600 }}
              >
                <Edit2 size={12} /> Editar
              </button>
            )}
            {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div style={{ borderTop: "1px solid #F3F4F6" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* KRs */}
              <div className="p-4" style={{ borderRight: "1px solid #F3F4F6" }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Resultados Clave</p>
                  {canEdit && (
                    <button
                      onClick={() => navigate(`/okrs/${okr.id}/krs`)}
                      className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      style={{ border: "1px solid #E5E7EB", fontSize: "10px", color: COLORS.blue, fontWeight: 700 }}
                    >
                      <Settings size={11} /> Gestionar KRs
                    </button>
                  )}
                </div>
                {okr.keyResults.length === 0 ? (
                  <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Sin Resultados Clave definidos.</p>
                ) : (
                  okr.keyResults.map((kr) => (
                    <KRBar key={kr.id} label={kr.metrica} actual={kr.valorActual} objetivo={kr.valorObjetivo} base={kr.valorBase} unidad={kr.unidad} estado={kr.estado} />
                  ))
                )}
              </div>

              {/* Proyectos con pesos */}
              <div className="p-4 space-y-3">
                {histData && (
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Tendencia</p>
                    <Sparkline data={histData} color={COLORS.blue} />
                  </div>
                )}

                {/* Proyectos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Proyectos ({proy.length}) · Cobertura: {coberturaTotalPeso}%
                      </p>
                      <div style={{ height: 4, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden", marginTop: 4, width: "100%" }}>
                        <div style={{ width: `${Math.min(100, coberturaTotalPeso)}%`, height: "100%", backgroundColor: coberturaTotalPeso >= 80 ? COLORS.green : coberturaTotalPeso >= 50 ? COLORS.blue : COLORS.orange, borderRadius: 99 }} />
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setShowVincularProyecto(true)}
                        className="flex items-center gap-1 flex-shrink-0 ml-3 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        style={{ border: `1px solid ${COLORS.green}`, fontSize: "10px", color: COLORS.green, fontWeight: 700 }}
                      >
                        <Link2 size={11} /> Vincular
                      </button>
                    )}
                  </div>

                  {proy.length === 0 ? (
                    <p style={{ fontSize: "11px", color: COLORS.orange }}>Ningún proyecto vinculado.</p>
                  ) : (
                    proy.sort((a, b) => b.avanceGlobal - a.avanceGlobal).map((p) => {
                      const vinculo = vinculos.find(v => v.proyectoId === p.id);
                      const peso = vinculo?.peso ?? 0;
                      const aporte = Math.round((p.avanceGlobal / 100) * peso);
                      const aporteColor = aporte >= 20 ? COLORS.green : aporte >= 10 ? COLORS.blue : COLORS.orange;
                      const pesoEditable = editPesos[p.id] ?? String(peso);

                      return (
                        <div key={p.id} className="mb-2 rounded-lg overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                          {confirmDesvincular === p.id ? (
                            <div className="p-3" style={{ backgroundColor: "#FEF3F2" }}>
                              <p style={{ fontSize: "12px", fontWeight: 700, color: "#991B1B", marginBottom: 4 }}>
                                ¿Desvincular "{p.nombre}" de este OKR?
                              </p>
                              <p style={{ fontSize: "10px", color: "#374151", marginBottom: 8 }}>
                                Esta acción eliminará el vínculo. El proyecto no será eliminado.
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => setConfirmDesvincular(null)} style={{ padding: "5px 12px", border: "1px solid #E5E7EB", borderRadius: 5, fontSize: "11px" }}>Cancelar</button>
                                <button onClick={() => handleDesvincular(p.id)} style={{ padding: "5px 12px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 5, fontSize: "11px", fontWeight: 700 }}>
                                  Desvincular
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5">
                              <div className="flex items-center gap-2 mb-1.5">
                                <FolderKanban size={11} color={p.avanceGlobal >= 70 ? COLORS.green : COLORS.blue} className="flex-shrink-0" />
                                <p
                                  style={{ fontSize: "11px", fontWeight: 600, color: "#000", flex: 1, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                  onClick={() => navigate(`/proyectos/${p.id}`)}
                                  className="hover:underline"
                                >
                                  {p.nombre}
                                </p>
                                {canEdit && (
                                  <button onClick={() => setConfirmDesvincular(p.id)} className="p-1 rounded hover:bg-red-50 flex-shrink-0" style={{ color: COLORS.orange }}>
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "#E5E7EB" }}>
                                  <div style={{ width: `${p.avanceGlobal}%`, height: "100%", backgroundColor: p.avanceGlobal >= 70 ? COLORS.green : COLORS.blue, borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: "#374151", minWidth: 28 }}>{p.avanceGlobal}%</span>
                              </div>
                              {/* Peso editable */}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span style={{ fontSize: "9px", color: "#9CA3AF" }}>Peso:</span>
                                {canEdit ? (
                                  <input
                                    type="number" min={0} max={100}
                                    value={pesoEditable}
                                    onChange={e => setEditPesos(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    onBlur={e => { updateVinculoPeso(p.id, okr.id, Math.min(100, Math.max(0, Number(e.target.value)))); }}
                                    style={{ width: 42, padding: "1px 5px", border: "1px solid #000", borderRadius: 3, fontSize: "10px", textAlign: "center", outline: "none" }}
                                  />
                                ) : (
                                  <span style={{ fontSize: "10px", fontWeight: 700, color: COLORS.blue }}>{peso}</span>
                                )}
                                <span style={{ fontSize: "9px", color: "#9CA3AF" }}>% · Aporte:</span>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: aporteColor }}>{aporte}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showVincularProyecto && (
        <VincularProyectoModal
          okr={okr}
          proyectosDisponibles={proyectosDisponibles}
          onClose={() => setShowVincularProyecto(false)}
          onVincular={handleVincularProyecto}
          getVinculosByOKR={getVinculosByOKR}
        />
      )}
    </>
  );
}

// ── Página OKRs ────────────────────────────────────────────────────────────────
export function OKRs() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { okrs, proyectos } = useData();
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterDepto, setFilterDepto] = useState("todos");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const canCreate = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const canEdit = canCreate;

  const filtered = okrs
    .filter((o) => {
      if (usuario?.rol === "jefe") return o.departamento === usuario.departamento;
      return true;
    })
    .filter((o) => filterEstado === "todos" || o.estado === filterEstado)
    .filter((o) => filterDepto === "todos" || o.departamento === filterDepto);

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedIds(next);
  };

  const stats = {
    activos: filtered.filter((o) => o.estado === "activo").length,
    promedio: Math.round(filtered.filter((o) => o.estado === "activo").reduce((s, o) => s + o.cumplimiento, 0) / Math.max(filtered.filter((o) => o.estado === "activo").length, 1)),
    enRiesgo: filtered.filter((o) => o.cumplimiento < 40 && o.estado === "activo").length,
    completados: filtered.filter((o) => o.estado === "completado").length,
  };

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "OKRs Activos", value: stats.activos, color: COLORS.green },
          { label: "Cumpl. Promedio", value: `${stats.promedio}%`, color: COLORS.blue },
          { label: "En Riesgo (<40%)", value: stats.enRiesgo, color: COLORS.orange },
          { label: "Completados", value: stats.completados, color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <p style={{ fontSize: "24px", fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-0 bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #000" }}>
          {ESTADOS_OKR.map((e) => (
            <button
              key={e.value}
              onClick={() => setFilterEstado(e.value)}
              style={{
                padding: "6px 14px", fontSize: "11px", fontWeight: 700,
                backgroundColor: filterEstado === e.value ? "#000" : "transparent",
                color: filterEstado === e.value ? "#fff" : "#374151",
                transition: "all 0.15s",
              }}
            >
              {e.label}
            </button>
          ))}
        </div>

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

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setExpandedIds(new Set(filtered.map((o) => o.id)))} style={{ fontSize: "11px", color: "#5454E9", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            Expandir todos
          </button>
          <span style={{ color: "#D1D5DB" }}>|</span>
          <button onClick={() => setExpandedIds(new Set())} style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            Colapsar todos
          </button>
          {canCreate && (
            <button onClick={() => navigate("/okrs/nuevo")} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}>
              <Plus size={14} /> Nuevo OKR
            </button>
          )}
        </div>
      </div>

      {/* OKR Cards */}
      <div>
        {filtered.map((o) => (
          <OKRCard
            key={o.id}
            okr={o}
            expanded={expandedIds.has(o.id)}
            onToggle={() => toggleExpanded(o.id)}
            canEdit={canEdit}
            proyectos={proyectos}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Target size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron OKRs con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}