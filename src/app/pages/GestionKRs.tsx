import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Plus, Trash2, Save, X, Edit2,
  FolderKanban, Link2, KeyRound, Target, BookOpen,
  AlertTriangle, CheckCircle2, Circle, Flag,
  ChevronDown, ChevronUp, ExternalLink, Sparkles, Clock,
} from "lucide-react";
import { KeyResult, Proyecto, ImpactoIA, RegistroAvanceKR } from "../data/mockData";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { ImpactoIAPanel } from "../components/ImpactoIAPanel";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  black: "#000",
  gray: "#717182",
};

// ── Badges ────────────────────────────────────────────────────────────────────
function KREstadoBadge({ estado }: { estado: "normal" | "superado" | "en_riesgo" }) {
  const map = {
    normal:    { bg: "#EEF2FF", color: "#3730A3", icon: <Circle size={9} />,        label: "Normal" },
    superado:  { bg: "#ECFDF5", color: "#065F46", icon: <CheckCircle2 size={9} />,  label: "Superado" },
    en_riesgo: { bg: "#FEF3F2", color: "#991B1B", icon: <AlertTriangle size={9} />, label: "En riesgo" },
  };
  const s = map[estado];
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded"
      style={{ backgroundColor: s.bg, color: s.color, fontSize: "10px", fontWeight: 700, width: "fit-content" }}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Progress bar for a KR ─────────────────────────────────────────────────────
function KRProgress({ kr }: { kr: KeyResult }) {
  const pct =
    kr.valorBase === kr.valorObjetivo ? 100
    : Math.min(100, Math.max(0,
        Math.round(((kr.valorActual - kr.valorBase) / (kr.valorObjetivo - kr.valorBase)) * 100)
      ));
  const color =
    kr.estado === "superado" ? COLORS.green :
    kr.estado === "en_riesgo" ? COLORS.orange : COLORS.blue;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-4 flex-wrap">
          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
            Base&nbsp;<strong style={{ color: "#374151" }}>{kr.valorBase}</strong>
          </span>
          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
            Actual&nbsp;<strong style={{ color, fontWeight: 700 }}>{kr.valorActual}</strong>
          </span>
          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
            Objetivo&nbsp;<strong style={{ color: "#374151" }}>{kr.valorObjetivo}</strong>
          </span>
          {kr.unidad && (
            <span style={{ fontSize: "11px", color: "#717182" }}>{kr.unidad}</span>
          )}
        </div>
        <span style={{ fontSize: "15px", fontWeight: 800, color }}>{pct}%</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F3F4F6" }}>
        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

// ── Proyecto card inside a KR ──────────────────────────────────────────────────
function ProyectoEnKRCard({
  proyecto, kr, okrObjetivo, onUnlink,
}: {
  proyecto: Proyecto;
  kr: KeyResult;
  okrObjetivo: string;
  onUnlink: () => void;
}) {
  const { updateProyecto } = useData();
  const navigate = useNavigate();
  const [impactoExpanded, setImpactoExpanded] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [impacto, setImpacto] = useState<ImpactoIA | undefined>(proyecto.impactoKR);

  const handleImpactoChange = (val: ImpactoIA | undefined) => {
    setImpacto(val);
    updateProyecto(proyecto.id, { impactoKR: val });
  };

  const estadoColor: Record<string, string> = {
    activo: COLORS.green, finalizado: COLORS.blue,
    borrador: "#9CA3AF", suspendido: COLORS.orange, archivado: "#9CA3AF",
  };
  const col = estadoColor[proyecto.estado] ?? "#9CA3AF";

  if (confirmUnlink) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: "#FEF3F2", border: "1.5px solid #FCA5A5" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>
          ¿Desvincular "{proyecto.nombre}"?
        </p>
        <p style={{ fontSize: "11px", color: "#374151", marginBottom: 12, lineHeight: 1.5 }}>
          El proyecto quedará sin KR asignado y su impacto calculado se perderá.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmUnlink(false)}
            style={{ padding: "6px 14px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
          >
            Cancelar
          </button>
          <button
            onClick={onUnlink}
            style={{ padding: "6px 14px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}
          >
            Desvincular
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-3 bg-white">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 34, height: 34, backgroundColor: col + "18" }}
        >
          <FolderKanban size={15} color={col} />
        </div>

        <div className="flex-1 min-w-0">
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {proyecto.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{proyecto.departamento}</span>
            <span style={{ fontSize: "10px", color: "#D1D5DB" }}>·</span>
            <span className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: col + "18", color: col, fontSize: "9px", fontWeight: 600, textTransform: "capitalize" }}>
              {proyecto.estado}
            </span>
            <span style={{ fontSize: "10px", color: "#D1D5DB" }}>·</span>
            <span style={{ fontSize: "10px", color: "#374151", fontWeight: 600 }}>{proyecto.avanceGlobal}% avance</span>
          </div>
        </div>

        {/* Impact badge */}
        {impacto && (
          <div className="flex-shrink-0 px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#EEF2FF" }}>
            <div className="flex items-center gap-1">
              {impacto.origen === "ia" && <Sparkles size={10} color={COLORS.blue} />}
              <span style={{ fontSize: "11px", fontWeight: 800, color: COLORS.blue }}>
                {impacto.porcentaje}%
              </span>
            </div>
            <span style={{ fontSize: "9px", color: "#6366F1" }}>impacto al KR</span>
          </div>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => navigate(`/proyectos/${proyecto.id}`)}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Ver ficha del proyecto"
          >
            <ExternalLink size={13} color="#9CA3AF" />
          </button>
          <button
            onClick={() => setImpactoExpanded(!impactoExpanded)}
            className="p-1.5 rounded hover:bg-gray-100"
            title={impactoExpanded ? "Ocultar impacto IA" : "Ver / calcular impacto IA"}
          >
            {impactoExpanded ? <ChevronUp size={14} color="#374151" /> : <ChevronDown size={14} color="#374151" />}
          </button>
          <button
            onClick={() => setConfirmUnlink(true)}
            className="p-1.5 rounded hover:bg-red-50"
            title="Desvincular proyecto"
            style={{ color: COLORS.orange }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* AI Impact panel */}
      {impactoExpanded && (
        <div className="p-4 border-t" style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}>
          <ImpactoIAPanel
            titulo="Impacto del proyecto en este KR"
            tipo="proyecto-kr"
            origen={{ titulo: proyecto.nombre, descripcion: proyecto.descripcion }}
            destino={{ titulo: kr.enunciado, descripcion: kr.metrica }}
            value={impacto}
            onChange={handleImpactoChange}
          />
        </div>
      )}
    </div>
  );
}

// ── Vincular proyecto form (inline) ───────────────────────────────────────────
function VincularProyectoForm({
  kr, okrObjetivo, proyectosDisponibles, onVincular, onCancel,
}: {
  kr: KeyResult;
  okrObjetivo: string;
  proyectosDisponibles: Proyecto[];
  onVincular: (proyectoId: string, impacto?: ImpactoIA) => void;
  onCancel: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [impacto, setImpacto] = useState<ImpactoIA | undefined>();
  const selected = proyectosDisponibles.find(p => p.id === selectedId);

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ border: `2px solid ${COLORS.blue}`, backgroundColor: "#F0F4FF" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 size={14} color={COLORS.blue} />
          <p style={{ fontSize: "12px", fontWeight: 800, color: COLORS.blue, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Vincular proyecto a este KR
          </p>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded hover:bg-blue-100">
          <X size={14} color="#374151" />
        </button>
      </div>

      <div>
        <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
          Proyecto <span style={{ color: COLORS.orange }}>*</span>
        </label>
        <select
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setImpacto(undefined); }}
          style={{ width: "100%", padding: "10px 12px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
        >
          <option value="">-- Selecciona un proyecto --</option>
          {proyectosDisponibles.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.departamento})</option>
          ))}
        </select>
        {proyectosDisponibles.length === 0 && (
          <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 6 }}>
            No hay proyectos disponibles. Todos los activos ya están vinculados o aún no existen.
          </p>
        )}
      </div>

      {selected && (
        <div className="rounded-lg p-3" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#000" }}>{selected.nombre}</p>
          <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 1 }}>{selected.departamento} · {selected.tipo} · {selected.avanceGlobal}% avance</p>
          {selected.descripcion && (
            <p style={{ fontSize: "11px", color: "#374151", marginTop: 4, lineHeight: 1.5 }}>{selected.descripcion}</p>
          )}
        </div>
      )}

      {selected && (
        <ImpactoIAPanel
          titulo="Impacto del proyecto en este KR"
          tipo="proyecto-kr"
          origen={{ titulo: selected.nombre, descripcion: selected.descripcion }}
          destino={{ titulo: kr.enunciado, descripcion: kr.metrica }}
          value={impacto}
          onChange={setImpacto}
        />
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          style={{ padding: "9px 18px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "12px", fontWeight: 600 }}
        >
          Cancelar
        </button>
        <button
          disabled={!selectedId}
          onClick={() => { if (selectedId) onVincular(selectedId, impacto); }}
          className="flex items-center gap-2"
          style={{
            padding: "9px 18px",
            backgroundColor: selectedId ? COLORS.blue : "#E5E7EB",
            color: selectedId ? "#fff" : "#9CA3AF",
            borderRadius: 8, fontSize: "12px", fontWeight: 700,
            cursor: selectedId ? "pointer" : "not-allowed",
          }}
        >
          <Link2 size={13} /> Vincular proyecto
        </button>
      </div>
    </div>
  );
}

// ── Full KR Card ───────────────────────────────────────────────────────────────
function RegistrarAvanceKRModal({
  kr, userName, onClose, onSave,
}: {
  kr: KeyResult;
  userName: string;
  onClose: () => void;
  onSave: (valorActual: number, comentario: string) => void;
}) {
  const [valor, setValor] = useState(String(kr.valorActual));
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const nextValue = Number(valor);
  const pct = Math.round(((nextValue - kr.valorBase) / Math.max(kr.valorObjetivo - kr.valorBase, 1)) * 100);
  const clampedPct = Math.min(100, Math.max(0, pct));
  const color = nextValue > kr.valorObjetivo ? COLORS.green : clampedPct >= 70 ? COLORS.blue : COLORS.orange;

  const handleSave = () => {
    if (valor === "" || Number.isNaN(nextValue)) {
      setError("Ingresa un valor actual numerico.");
      return;
    }
    if (!comentario.trim()) {
      setError("Agrega una nota corta para el historial.");
      return;
    }
    onSave(nextValue, comentario.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#000" }}>
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: 800, textTransform: "uppercase" }}>{kr.id}</p>
            <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 800 }}>Registrar avance del KR</h3>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.65)", fontSize: "22px" }}>×</button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="px-3 py-2 rounded" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: "12px" }}>{error}</div>}
          <div className="rounded-lg p-3" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5 }}>{kr.enunciado}</p>
            <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 6 }}>Base {kr.valorBase} - Objetivo {kr.valorObjetivo} {kr.unidad}</p>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Valor actual ({kr.unidad})</label>
            <input type="number" value={valor} onChange={(e) => { setValor(e.target.value); setError(""); }} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #000", borderRadius: 8, fontSize: "14px", outline: "none" }} />
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Cumplimiento estimado</span>
                <span style={{ fontSize: "16px", fontWeight: 900, color }}>{Math.max(0, pct)}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F3F4F6" }}>
                <div style={{ height: "100%", width: `${clampedPct}%`, backgroundColor: color, borderRadius: 99 }} />
              </div>
              {nextValue > kr.valorObjetivo && <p style={{ fontSize: "10px", color: COLORS.green, marginTop: 5, fontWeight: 700 }}>El KR quedara marcado como superado.</p>}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Nota de avance</label>
            <textarea rows={3} value={comentario} onChange={(e) => { setComentario(e.target.value); setError(""); }} placeholder="Describe la fuente del nuevo valor, corte o evidencia registrada." style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", resize: "vertical", outline: "none", fontFamily: "Montserrat, sans-serif" }} />
          </div>
          <div style={{ padding: "10px 12px", backgroundColor: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 800, textTransform: "uppercase" }}>Registrado por</p>
            <p style={{ fontSize: "12px", color: "#000", fontWeight: 700 }}>{userName}</p>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1.5px solid #000", borderRadius: 8, fontSize: "12px", fontWeight: 700 }}>Cancelar</button>
          <button onClick={handleSave} className="flex items-center gap-2" style={{ padding: "9px 18px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 800 }}>
            <Save size={13} /> Guardar avance
          </button>
        </div>
      </div>
    </div>
  );
}

function KRCard({
  kr, okrId, okrObjetivo, proyectos, registros, onSave, onDelete, onVincular, onUnlink, onRegistrarAvance, canEdit, userName,
}: {
  kr: KeyResult;
  okrId: string;
  okrObjetivo: string;
  proyectos: Proyecto[];
  registros: RegistroAvanceKR[];
  onSave: (krId: string, changes: Partial<KeyResult>) => void;
  onDelete: (krId: string) => void;
  onVincular: (krId: string, proyectoId: string, impacto?: ImpactoIA) => void;
  onUnlink: (krId: string, proyectoId: string) => void;
  onRegistrarAvance: (krId: string, valorActual: number, comentario: string) => void;
  canEdit: boolean;
  userName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showVincular, setShowVincular] = useState(false);
  const [showRegistrarAvance, setShowRegistrarAvance] = useState(false);
  const [impactoExpanded, setImpactoExpanded] = useState(false);
  const [editForm, setEditForm] = useState<Partial<KeyResult>>({});
  const [localImpacto, setLocalImpacto] = useState<ImpactoIA | undefined>(kr.impactoObjetivo);

  const linkedProjects = proyectos.filter(p => kr.proyectoIds.includes(p.id));
  const availableProjects = proyectos.filter(
    p => !kr.proyectoIds.includes(p.id) && (p.estado === "activo" || p.estado === "borrador")
  );

  const startEdit = () => {
    setEditForm({ ...kr });
    setLocalImpacto(kr.impactoObjetivo);
    setEditing(true);
    setShowVincular(false);
  };

  const saveEdit = () => {
    onSave(kr.id, { ...editForm, impactoObjetivo: localImpacto });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm({});
    setLocalImpacto(kr.impactoObjetivo);
  };

  const handleImpactoObjetivoChange = (val: ImpactoIA | undefined) => {
    setLocalImpacto(val);
    onSave(kr.id, { impactoObjetivo: val });
  };

  // ── Delete confirmation ──
  if (confirmDelete) {
    return (
      <div className="rounded-xl p-5" style={{ border: "2px solid #FCA5A5", backgroundColor: "#FEF3F2" }}>
        <p style={{ fontSize: "15px", fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>¿Eliminar este Resultado Clave?</p>
        <p style={{ fontSize: "12px", color: "#374151", marginBottom: 4, lineHeight: 1.5 }}>{kr.enunciado}</p>
        {linkedProjects.length > 0 && (
          <p style={{ fontSize: "11px", color: COLORS.orange, marginBottom: 10 }}>
            ⚠ Tiene {linkedProjects.length} proyecto(s) vinculado(s) que quedarán sin KR asignado.
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ padding: "8px 16px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onDelete(kr.id)}
            className="flex items-center gap-1.5"
            style={{ padding: "8px 16px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 700 }}
          >
            <Trash2 size={13} /> Eliminar KR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-white" style={{ border: "2px solid #E5E7EB" }}>

      {/* ── KR Header ── */}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          {/* Icon + ID */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center justify-center rounded-xl"
              style={{ width: 40, height: 40, backgroundColor: "#000" }}>
              <KeyRound size={18} color="#E4EB60" />
            </div>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#fff", backgroundColor: "#000", padding: "2px 6px", borderRadius: 3 }}>
              {kr.id}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <KREstadoBadge estado={kr.estado} />
              {kr.metrica && kr.metrica !== kr.enunciado && (
                <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "#F9FAFB", color: "#374151", fontSize: "10px" }}>
                  {kr.metrica}
                </span>
              )}
            </div>

            {!editing && (
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#000", lineHeight: 1.6 }}>
                {kr.enunciado}
              </p>
            )}
          </div>

          {/* Action buttons (view mode) */}
          {canEdit && !editing && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowRegistrarAvance(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                style={{ border: `1px solid ${COLORS.blue}`, fontSize: "11px", fontWeight: 700, color: COLORS.blue }}
              >
                <Plus size={12} /> Avance
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: "1px solid #E5E7EB", fontSize: "11px", fontWeight: 600, color: "#374151" }}
              >
                <Edit2 size={12} /> Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                style={{ border: "1px solid #E5E7EB", color: COLORS.orange }}
                title="Eliminar KR"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Edit form ── */}
        {editing ? (
          <div className="space-y-4 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
            {/* Enunciado */}
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                Enunciado del KR <span style={{ color: COLORS.orange }}>*</span>
              </label>
              <textarea
                rows={3}
                value={editForm.enunciado ?? kr.enunciado}
                onChange={e => setEditForm(f => ({ ...f, enunciado: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #000", borderRadius: 8, fontSize: "13px", outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
            {/* Métrica */}
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Métrica (etiqueta corta)</label>
              <input
                value={editForm.metrica ?? kr.metrica}
                onChange={e => setEditForm(f => ({ ...f, metrica: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif" }}
              />
            </div>
            {/* Valores + Unidad + Estado */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Valor base", field: "valorBase" },
                { label: "Valor actual", field: "valorActual" },
                { label: "Valor objetivo", field: "valorObjetivo" },
                { label: "Unidad", field: "unidad" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{label}</label>
                  <input
                    type={field === "unidad" ? "text" : "number"}
                    value={(editForm[field as keyof KeyResult] as any) ?? (kr[field as keyof KeyResult] as any)}
                    onChange={e => setEditForm(f => ({
                      ...f,
                      [field]: field === "unidad" ? e.target.value : Number(e.target.value),
                    }))}
                    style={{ width: "100%", padding: "9px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", outline: "none" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ maxWidth: 220 }}>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Estado</label>
              <select
                value={editForm.estado ?? kr.estado}
                onChange={e => setEditForm(f => ({ ...f, estado: e.target.value as KeyResult["estado"] }))}
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif" }}
              >
                <option value="normal">Normal</option>
                <option value="superado">Superado</option>
                <option value="en_riesgo">En riesgo</option>
              </select>
            </div>

            {/* AI Impact on Objective */}
            <ImpactoIAPanel
              titulo="Impacto de este KR en el Objetivo"
              tipo="kr-objetivo"
              origen={{ titulo: editForm.enunciado ?? kr.enunciado, descripcion: editForm.metrica ?? kr.metrica }}
              destino={{ titulo: okrObjetivo }}
              value={localImpacto}
              onChange={setLocalImpacto}
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5"
                style={{ padding: "10px 20px", border: "1.5px solid #000", borderRadius: 8, fontSize: "12px", fontWeight: 600 }}
              >
                <X size={13} /> Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5"
                style={{ padding: "10px 20px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 700 }}
              >
                <Save size={13} /> Guardar cambios
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode: progress + impact toggle ── */
          <div className="space-y-3">
            <KRProgress kr={kr} />

            <div className="rounded-lg p-3" style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E7EB" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={12} color="#9CA3AF" />
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Historial de valores
                  </span>
                </div>
                <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{registros.length} registros</span>
              </div>
              {registros.length === 0 ? (
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Aun no se han registrado avances periodicos para este KR.</p>
              ) : (
                <div className="space-y-2">
                  {registros.slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "#000" }}>
                          {r.valorAnterior} → {r.valorActual} {kr.unidad}
                        </p>
                        <p style={{ fontSize: "10px", color: "#717182", marginTop: 2 }}>{r.comentario}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{r.fecha}</p>
                        <p style={{ fontSize: "9px", color: "#9CA3AF" }}>{r.registradoPor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Impacto en objetivo (collapsible) */}
            <button
              onClick={() => setImpactoExpanded(!impactoExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ border: "1px solid #E5E7EB", fontSize: "11px", fontWeight: 600, color: "#374151" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={12} color={COLORS.blue} />
                <span>Impacto en el Objetivo</span>
                {kr.impactoObjetivo ? (
                  <span className="px-1.5 py-0.5 rounded"
                    style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#EEF2FF", color: COLORS.blue }}>
                    {kr.impactoObjetivo.porcentaje}% · {kr.impactoObjetivo.origen === "ia" ? "IA" : "Manual"}
                  </span>
                ) : (
                  <span style={{ fontSize: "10px", color: "#9CA3AF" }}>Sin calcular</span>
                )}
              </div>
              {impactoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {impactoExpanded && (
              <div className="px-1">
                <ImpactoIAPanel
                  titulo="Impacto de este KR en el Objetivo"
                  tipo="kr-objetivo"
                  origen={{ titulo: kr.enunciado, descripcion: kr.metrica }}
                  destino={{ titulo: okrObjetivo }}
                  value={localImpacto}
                  onChange={handleImpactoObjetivoChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Projects section ── */}
      {!editing && (
        <div className="p-5 space-y-3" style={{ backgroundColor: "#FAFAFA", borderTop: "1.5px solid #F3F4F6" }}>
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban size={14} color="#374151" />
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Proyectos vinculados
              </p>
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 20, height: 20,
                  backgroundColor: linkedProjects.length > 0 ? COLORS.blue : "#E5E7EB",
                  color: linkedProjects.length > 0 ? "#fff" : "#9CA3AF",
                  fontSize: "10px", fontWeight: 700,
                }}
              >
                {linkedProjects.length}
              </span>
            </div>

            {canEdit && !showVincular && (
              <button
                onClick={() => setShowVincular(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COLORS.black, color: "#fff", fontSize: "11px", fontWeight: 700 }}
              >
                <Link2 size={12} /> Vincular proyecto
              </button>
            )}
          </div>

          {/* Empty state */}
          {linkedProjects.length === 0 && !showVincular && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ border: "1px dashed #E5E7EB" }}>
              <FolderKanban size={16} color="#D1D5DB" />
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                Sin proyectos vinculados. Vincula uno para comenzar a medir el impacto.
              </p>
            </div>
          )}

          {/* Linked projects */}
          <div className="space-y-2">
            {linkedProjects.map(p => (
              <ProyectoEnKRCard
                key={p.id}
                proyecto={p}
                kr={kr}
                okrObjetivo={okrObjetivo}
                onUnlink={() => onUnlink(kr.id, p.id)}
              />
            ))}
          </div>

          {/* Vincular form */}
          {showVincular && (
            <VincularProyectoForm
              kr={kr}
              okrObjetivo={okrObjetivo}
              proyectosDisponibles={availableProjects}
              onVincular={(proyectoId, impacto) => {
                onVincular(kr.id, proyectoId, impacto);
                setShowVincular(false);
              }}
              onCancel={() => setShowVincular(false)}
            />
          )}
        </div>
      )}
      {showRegistrarAvance && (
        <RegistrarAvanceKRModal
          kr={kr}
          userName={userName}
          onClose={() => setShowRegistrarAvance(false)}
          onSave={(valorActual, comentario) => {
            onRegistrarAvance(kr.id, valorActual, comentario);
            setShowRegistrarAvance(false);
          }}
        />
      )}
    </div>
  );
}

// ── Nuevo KR form ─────────────────────────────────────────────────────────────
function NuevoKRForm({
  okrObjetivo, onAdd, onCancel,
}: {
  okrObjetivo: string;
  onAdd: (kr: Omit<KeyResult, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    enunciado: "", metrica: "",
    valorBase: "0", valorObjetivo: "", unidad: "",
    estado: "normal" as KeyResult["estado"],
  });
  const [impactoObjetivo, setImpactoObjetivo] = useState<ImpactoIA | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.enunciado.trim()) e.enunciado = "El enunciado es requerido";
    if (!form.valorObjetivo) e.valorObjetivo = "El valor objetivo es requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    onAdd({
      enunciado: form.enunciado.trim(),
      metrica: form.metrica.trim() || form.enunciado.trim(),
      valorBase: Number(form.valorBase) || 0,
      valorActual: Number(form.valorBase) || 0,
      valorObjetivo: Number(form.valorObjetivo),
      unidad: form.unidad.trim(),
      estado: form.estado,
      proyectoIds: [],
      impactoObjetivo,
    });
  };

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ border: `2px solid ${COLORS.blue}`, backgroundColor: "#F0F4FF" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 38, height: 38, backgroundColor: COLORS.blue }}>
            <Plus size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 800, color: COLORS.blue }}>Nuevo Resultado Clave</p>
            <p style={{ fontSize: "10px", color: "#6366F1" }}>Define la sentencia completa y sus métricas</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded hover:bg-blue-100">
          <X size={16} color="#374151" />
        </button>
      </div>

      {/* Enunciado */}
      <div>
        <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
          Enunciado del KR <span style={{ color: COLORS.orange }}>*</span>
        </label>
        <textarea
          rows={3}
          value={form.enunciado}
          onChange={e => set("enunciado", e.target.value)}
          placeholder='Ej: "Aumentar de 0 a 12 los syllabus actualizados con metodologías activas durante 2025-I."'
          style={{
            width: "100%", padding: "10px 12px",
            border: `1.5px solid ${errors.enunciado ? COLORS.orange : "#000"}`,
            borderRadius: 8, fontSize: "13px", outline: "none",
            fontFamily: "Montserrat, sans-serif", resize: "vertical",
            lineHeight: 1.6, backgroundColor: "#fff",
          }}
        />
        {errors.enunciado && <p style={{ fontSize: "10px", color: COLORS.orange, marginTop: 3 }}>{errors.enunciado}</p>}
      </div>

      {/* Métrica */}
      <div>
        <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
          Métrica (etiqueta corta, opcional)
        </label>
        <input
          value={form.metrica}
          onChange={e => set("metrica", e.target.value)}
          placeholder='Ej: "Syllabus actualizados con metodologías activas"'
          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
        />
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Valor base", key: "valorBase", type: "number" },
          { label: "Valor objetivo *", key: "valorObjetivo", type: "number" },
          { label: "Unidad", key: "unidad", type: "text" },
          { label: "Estado", key: "estado", type: "select" },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{label}</label>
            {type === "select" ? (
              <select
                value={form[key as keyof typeof form]}
                onChange={e => set(key, e.target.value)}
                style={{ width: "100%", padding: "9px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
              >
                <option value="normal">Normal</option>
                <option value="superado">Superado</option>
                <option value="en_riesgo">En riesgo</option>
              </select>
            ) : (
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => set(key, e.target.value)}
                placeholder={key === "unidad" ? "Ej: artículos" : "0"}
                style={{
                  width: "100%", padding: "9px 10px",
                  border: `1.5px solid ${errors[key] ? COLORS.orange : "#E5E7EB"}`,
                  borderRadius: 8, fontSize: "12px", outline: "none",
                  backgroundColor: "#fff",
                }}
              />
            )}
            {errors[key] && <p style={{ fontSize: "10px", color: COLORS.orange, marginTop: 2 }}>{errors[key]}</p>}
          </div>
        ))}
      </div>

      {/* AI Impact */}
      <ImpactoIAPanel
        titulo="Impacto de este KR en el Objetivo"
        tipo="kr-objetivo"
        origen={{ titulo: form.enunciado.trim() || "Nuevo KR", descripcion: form.metrica }}
        destino={{ titulo: okrObjetivo }}
        value={impactoObjetivo}
        onChange={setImpactoObjetivo}
        disabled={!form.enunciado.trim()}
      />

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          style={{ padding: "10px 20px", border: "1.5px solid #000", borderRadius: 8, fontSize: "12px", fontWeight: 600 }}
        >
          Cancelar
        </button>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2"
          style={{ padding: "10px 20px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 700 }}
        >
          <Plus size={14} /> Agregar KR
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function GestionKRs() {
  const { okrId } = useParams<{ okrId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { okrs, proyectos, apuestas, metas, updateKR, removeKR, addKR, setProyectoKR, unlinkProjectFromKR, registrarAvanceKR, getRegistrosByKR } = useData();

  const okr = okrs.find(o => o.id === okrId);
  const canEdit = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const [showNuevoKR, setShowNuevoKR] = useState(false);

  if (!okr) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
        <AlertTriangle size={40} color={COLORS.orange} />
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#000" }}>Objetivo no encontrado</p>
        <p style={{ fontSize: "12px", color: "#717182" }}>El ID "{okrId}" no corresponde a ningún objetivo registrado.</p>
        <button
          onClick={() => navigate("/okrs")}
          className="flex items-center gap-2"
          style={{ padding: "10px 20px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 700 }}
        >
          <ArrowLeft size={14} /> Volver a Objetivos
        </button>
      </div>
    );
  }

  const apuesta = apuestas.find(a => a.id === okr.apuestaId);
  const meta = metas.find(m => m.id === okr.metaId);
  const cumplColor = okr.cumplimiento >= 70 ? COLORS.green : okr.cumplimiento >= 40 ? COLORS.blue : COLORS.orange;

  const handleSaveKR = (krId: string, changes: Partial<KeyResult>) =>
    updateKR(okr.id, krId, changes);

  const handleDeleteKR = (krId: string) =>
    removeKR(okr.id, krId);

  const handleAddKR = (krData: Omit<KeyResult, "id">) => {
    addKR(okr.id, krData);
    setShowNuevoKR(false);
  };

  const handleVincular = (krId: string, proyectoId: string, impacto?: ImpactoIA) =>
    setProyectoKR(proyectoId, krId, impacto);

  const handleUnlink = (krId: string, proyectoId: string) =>
    unlinkProjectFromKR(proyectoId, krId);

  const handleRegistrarAvance = (krId: string, valorActual: number, comentario: string) =>
    registrarAvanceKR(okr.id, krId, valorActual, usuario?.nombre ?? "Usuario", comentario);

  return (
    <div style={{ backgroundColor: "#F9FAFB", minHeight: "100%" }}>

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-10 bg-white px-6 py-3" style={{ borderBottom: "2px solid #000" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/okrs")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            style={{ border: "1px solid #E5E7EB", fontSize: "12px", fontWeight: 600, color: "#374151" }}
          >
            <ArrowLeft size={14} /> Objetivos
          </button>

          <div className="w-px h-6 flex-shrink-0" style={{ backgroundColor: "#E5E7EB" }} />

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff", backgroundColor: "#000", padding: "2px 7px", borderRadius: 3, flexShrink: 0 }}>
              {okr.id}
            </span>
            <h1 style={{ fontSize: "14px", fontWeight: 800, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Gestión de KRs — {okr.objetivo}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "#F9FAFB", color: "#374151", fontSize: "10px", fontWeight: 600 }}>
              {okr.departamento}
            </span>
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: "10px", fontWeight: 600 }}>
              {okr.periodo}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── OKR Context card ── */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1.5px solid #E5E7EB" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Objetivo */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 38, height: 38, backgroundColor: COLORS.blue + "18" }}>
                <Target size={18} color={COLORS.blue} />
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: "9px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Objetivo</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#000", lineHeight: 1.5 }}>{okr.objetivo}</p>
              </div>
            </div>

            {/* Apuesta */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 38, height: 38, backgroundColor: "#FEF9C3" }}>
                <Flag size={18} color="#B45309" />
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: "9px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Apuesta Estratégica</p>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", lineHeight: 1.4 }}>{apuesta?.nombre ?? "—"}</p>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 38, height: 38, backgroundColor: COLORS.green + "22" }}>
                <BookOpen size={18} color={COLORS.green} />
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: "9px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Meta Institucional</p>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", lineHeight: 1.4 }}>{meta?.nombre ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: "11px", color: "#9CA3AF", flexShrink: 0 }}>Cumplimiento del Objetivo</span>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F3F4F6" }}>
              <div style={{ width: `${okr.cumplimiento}%`, height: "100%", backgroundColor: cumplColor, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 800, color: cumplColor, flexShrink: 0 }}>{okr.cumplimiento}%</span>
            <div className="px-3 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#000" }}>{okr.keyResults.length}</span>
              <span style={{ fontSize: "11px", color: "#9CA3AF" }}> KRs</span>
            </div>
          </div>
        </div>

        {/* ── KRs list ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#000" }}>Resultados Clave</h2>
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 26, height: 26, backgroundColor: "#000", color: COLORS.yellow, fontSize: "12px", fontWeight: 800 }}
              >
                {okr.keyResults.length}
              </span>
            </div>

            {canEdit && !showNuevoKR && (
              <button
                onClick={() => setShowNuevoKR(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}
              >
                <Plus size={14} /> Nuevo KR
              </button>
            )}
          </div>

          <div className="space-y-5">
            {okr.keyResults.map(kr => (
              <KRCard
                key={kr.id}
                kr={kr}
                okrId={okr.id}
                okrObjetivo={okr.objetivo}
                proyectos={proyectos}
                registros={getRegistrosByKR(kr.id)}
                onSave={handleSaveKR}
                onDelete={handleDeleteKR}
                onVincular={handleVincular}
                onUnlink={handleUnlink}
                onRegistrarAvance={handleRegistrarAvance}
                canEdit={canEdit}
                userName={usuario?.nombre ?? "Usuario"}
              />
            ))}

            {okr.keyResults.length === 0 && !showNuevoKR && (
              <div
                className="flex flex-col items-center justify-center py-14 rounded-xl"
                style={{ border: "2px dashed #E5E7EB", backgroundColor: "#FAFAFA" }}
              >
                <KeyRound size={36} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                  Sin Resultados Clave
                </p>
                <p style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "center", maxWidth: 320, marginBottom: 16 }}>
                  Este objetivo aún no tiene KRs definidos. Agrega el primero para comenzar a medir el avance.
                </p>
                {canEdit && (
                  <button
                    onClick={() => setShowNuevoKR(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:opacity-90"
                    style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}
                  >
                    <Plus size={14} /> Agregar primer KR
                  </button>
                )}
              </div>
            )}

            {showNuevoKR && (
              <NuevoKRForm
                okrObjetivo={okr.objetivo}
                onAdd={handleAddKR}
                onCancel={() => setShowNuevoKR(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
