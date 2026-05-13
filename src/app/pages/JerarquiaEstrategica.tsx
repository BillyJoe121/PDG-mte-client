import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight, ChevronDown, Plus, Flag, BookOpen,
  Target, FolderKanban, AlertCircle, CheckCircle2, Search, X,
  Sparkles, KeyRound,
} from "lucide-react";
import { ApuestaEstrategica, MetaInstitucional, OKR, KeyResult, Proyecto } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  black: "#000000",
};

function ProgressBar({ value, color = COLORS.blue }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#F3F4F6", minWidth: 80 }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", backgroundColor: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color: color, minWidth: 34 }}>{value}%</span>
    </div>
  );
}

function ImpactBadge({ pct, origen, label }: { pct?: number; origen?: "ia" | "manual"; label: string }) {
  if (pct == null) return null;
  const isIA = origen === "ia";
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: isIA ? "#EEF2FF" : "#F3F4F6",
        color: isIA ? COLORS.blue : "#374151",
        fontSize: "9px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
      title={`${label}: ${pct}% (${isIA ? "IA" : "Manual"})`}
    >
      {isIA && <Sparkles size={9} />}
      {pct}% {label}
    </span>
  );
}

// ── Nodo Proyecto ─────────────────────────────────────────────────────────────
function ProyectoNode({ proyecto, navigate }: { proyecto: Proyecto; navigate: (path: string) => void }) {
  const estadoColor: Record<string, string> = {
    activo: COLORS.green, finalizado: COLORS.blue, borrador: "#9CA3AF", suspendido: COLORS.orange, archivado: "#9CA3AF",
  };
  return (
    <div
      className="ml-12 mb-2 rounded-lg flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:shadow-sm transition-shadow"
      style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
      onClick={() => navigate(`/proyectos/${proyecto.id}`)}
    >
      <FolderKanban size={14} color={estadoColor[proyecto.estado]} />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {proyecto.nombre}
        </p>
        <p style={{ fontSize: "10px", color: "#9CA3AF" }}>
          {proyecto.tutores.join(", ")} · {proyecto.departamento} · {proyecto.periodoInicio}{proyecto.periodoFin !== proyecto.periodoInicio ? ` – ${proyecto.periodoFin}` : ""}
        </p>
      </div>
      <ImpactBadge pct={proyecto.impactoKR?.porcentaje} origen={proyecto.impactoKR?.origen} label="al KR" />
      <span className="px-2 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: estadoColor[proyecto.estado] + "20", color: estadoColor[proyecto.estado], fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}>
        {proyecto.estado}
      </span>
      <div className="flex-shrink-0" style={{ minWidth: 100 }}>
        <ProgressBar value={proyecto.avanceGlobal} color={estadoColor[proyecto.estado]} />
      </div>
    </div>
  );
}

// ── Nodo KR ───────────────────────────────────────────────────────────────────
function KRNode({ kr, proyectos, navigate, filtroPeriodo }: {
  kr: KeyResult; proyectos: Proyecto[]; navigate: (path: string) => void; filtroPeriodo: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const proy = proyectos.filter((p) =>
    p.krId === kr.id &&
    (filtroPeriodo === "todos" || p.periodoInicio === filtroPeriodo || p.periodoFin === filtroPeriodo)
  );
  const sinCobertura = proy.length === 0;
  const pct = Math.round(((kr.valorActual - kr.valorBase) / Math.max(kr.valorObjetivo - kr.valorBase, 1)) * 100);
  const krColor = kr.estado === "superado" ? COLORS.green : kr.estado === "en_riesgo" ? COLORS.orange : COLORS.blue;

  return (
    <div className="ml-10 mb-2">
      <div className="rounded-lg overflow-hidden" style={{ border: `1.5px solid ${sinCobertura ? COLORS.orange + "60" : "#E5E7EB"}`, backgroundColor: "#fff" }}>
        {sinCobertura && (
          <div className="px-4 py-1 flex items-center gap-1" style={{ backgroundColor: "#FEF3F2" }}>
            <AlertCircle size={10} color={COLORS.orange} />
            <span style={{ fontSize: "9px", color: COLORS.orange, fontWeight: 600 }}>Sin proyectos asociados</span>
          </div>
        )}
        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(!expanded)}>
          <KeyRound size={14} color={krColor} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span style={{ fontSize: "9px", fontWeight: 800, color: krColor, backgroundColor: krColor + "18", padding: "1px 6px", borderRadius: 3 }}>{kr.id}</span>
              <ImpactBadge pct={kr.impactoObjetivo?.porcentaje} origen={kr.impactoObjetivo?.origen} label="al Objetivo" />
              {kr.estado === "superado" && <CheckCircle2 size={11} color={COLORS.green} />}
            </div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", lineHeight: 1.45 }}>{kr.enunciado}</p>
            <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 2 }}>
              {kr.metrica} · {kr.valorActual} / {kr.valorObjetivo} {kr.unidad} · {proy.length} proyectos
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div style={{ minWidth: 110 }}><ProgressBar value={Math.min(pct, 100)} color={krColor} /></div>
            {expanded ? <ChevronDown size={14} color="#9CA3AF" /> : <ChevronRight size={14} color="#9CA3AF" />}
          </div>
        </div>
      </div>

      {expanded && proy.length > 0 && (
        <div className="mt-1">
          {proy.map((p) => <ProyectoNode key={p.id} proyecto={p} navigate={navigate} />)}
        </div>
      )}
    </div>
  );
}

// ── Nodo Objetivo (OKR) ───────────────────────────────────────────────────────
function ObjetivoNode({ okr, proyectos, navigate, filtroPeriodo, parent }: {
  okr: OKR; proyectos: Proyecto[]; navigate: (path: string) => void; filtroPeriodo: string;
  parent: "apuesta" | "meta";
}) {
  const [expanded, setExpanded] = useState(false);
  const estadoColor: Record<string, string> = { activo: COLORS.green, completado: COLORS.blue, borrador: "#9CA3AF", cancelado: COLORS.orange };
  const cumplColor = okr.cumplimiento >= 70 ? COLORS.green : okr.cumplimiento >= 40 ? COLORS.yellow : COLORS.orange;
  const impacto = parent === "apuesta" ? okr.impactoApuesta : okr.impactoMeta;
  const impactoLabel = parent === "apuesta" ? "a la Apuesta" : "a la Meta";
  const proyectosOKR = proyectos.filter((p) =>
    p.okrIds?.includes(okr.id) &&
    (filtroPeriodo === "todos" || p.periodoInicio === filtroPeriodo || p.periodoFin === filtroPeriodo)
  );

  return (
    <div className="ml-6 mb-2">
      <div className="rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#fff" }}>
        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(!expanded)}>
          <Target size={15} color={COLORS.blue} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span style={{ fontSize: "9px", fontWeight: 800, color: COLORS.blue, backgroundColor: "#EEF2FF", padding: "1px 6px", borderRadius: 3 }}>{okr.id}</span>
              <ImpactBadge pct={impacto?.porcentaje} origen={impacto?.origen} label={impactoLabel} />
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#000", lineHeight: 1.45 }}>{okr.objetivo}</p>
            <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{okr.departamento} · {okr.periodo} · {okr.keyResults.length} KRs · {proyectosOKR.length} proyectos</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: estadoColor[okr.estado] + "20", color: estadoColor[okr.estado], fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}>{okr.estado}</span>
            <div style={{ minWidth: 110 }}><ProgressBar value={okr.cumplimiento} color={cumplColor} /></div>
            {expanded ? <ChevronDown size={14} color="#9CA3AF" /> : <ChevronRight size={14} color="#9CA3AF" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-1">
          {okr.keyResults.length === 0 ? (
            <div className="ml-10 mb-2 px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: "#F9FAFB", border: "1px dashed #E5E7EB" }}>
              <KeyRound size={12} color="#D1D5DB" />
              <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Sin Key Results definidos</span>
            </div>
          ) : (
            okr.keyResults.map((kr) => (
              <KRNode key={kr.id} kr={kr} proyectos={proyectos} navigate={navigate} filtroPeriodo={filtroPeriodo} />
            ))
          )}
          <div className="ml-10 mt-2 mb-2">
            <p style={{ fontSize: "10px", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Proyectos vinculados al OKR
            </p>
            {proyectosOKR.length === 0 ? (
              <div className="px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: "#FEF3F2", border: "1px dashed #FCA5A5" }}>
                <AlertCircle size={12} color={COLORS.orange} />
                <span style={{ fontSize: "11px", color: COLORS.orange }}>Sin cobertura de proyectos</span>
              </div>
            ) : (
              proyectosOKR.map((p) => <ProyectoNode key={`${okr.id}-${p.id}`} proyecto={p} navigate={navigate} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Nodo Apuesta ──────────────────────────────────────────────────────────────
function ApuestaNode({ apuesta, metas, okrs, proyectos, navigate, filtroPeriodo }: {
  apuesta: ApuestaEstrategica; metas: MetaInstitucional[]; okrs: OKR[]; proyectos: Proyecto[];
  navigate: (path: string) => void; filtroPeriodo: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const okrsApuesta = okrs.filter((o) => o.apuestaId === apuesta.id && (filtroPeriodo === "todos" || o.periodo === filtroPeriodo));
  const metasApuesta = metas.filter((m) =>
    m.apuestaIds?.includes(apuesta.id) || okrsApuesta.some((o) => o.metaId === m.id)
  );
  const cumplColor = apuesta.cumplimiento >= 70 ? COLORS.green : apuesta.cumplimiento >= 40 ? "#B8C500" : COLORS.orange;

  return (
    <div className="mb-4">
      <div className="rounded-lg overflow-hidden" style={{ border: "2px solid #000", backgroundColor: "#000" }}>
        <div className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => setExpanded(!expanded)}>
          <Flag size={16} color="#E4EB60" />
          <div className="flex-1 min-w-0">
            <div className="mb-0.5">
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Apuesta Estratégica</span>
            </div>
            <p style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{apuesta.nombre}</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{apuesta.areaInstitucional} · {apuesta.fechaInicio.slice(0, 4)} – {apuesta.fechaCierre.slice(0, 4)}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: apuesta.estado === "activa" ? COLORS.green + "30" : "#333", color: apuesta.estado === "activa" ? COLORS.green : "#9CA3AF", fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}>{apuesta.estado}</span>
            <div className="flex items-center gap-2">
              <div className="rounded-full overflow-hidden" style={{ height: 6, width: 80, backgroundColor: "rgba(255,255,255,0.15)" }}>
                <div style={{ width: `${apuesta.cumplimiento}%`, height: "100%", backgroundColor: cumplColor, borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: cumplColor }}>{apuesta.cumplimiento}%</span>
            </div>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>{metasApuesta.length} metas Â· {okrsApuesta.length} objetivos</span>
            {expanded ? <ChevronDown size={15} color="rgba(255,255,255,0.6)" /> : <ChevronRight size={15} color="rgba(255,255,255,0.6)" />}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="mt-1">
          {metasApuesta.length === 0 ? (
            <div className="ml-6 mb-2 px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: "#F9FAFB", border: "1px dashed #E5E7EB" }}>
              <Target size={12} color="#D1D5DB" />
              <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Sin Metas asociadas</span>
            </div>
          ) : (
            metasApuesta.map((m) => <MetaNode key={m.id} meta={m} okrs={okrsApuesta} proyectos={proyectos} navigate={navigate} filtroPeriodo={filtroPeriodo} apuestaId={apuesta.id} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── Nodo Meta ─────────────────────────────────────────────────────────────────
function MetaNode({ meta, okrs, proyectos, navigate, filtroPeriodo, apuestaId }: {
  meta: MetaInstitucional; okrs: OKR[]; proyectos: Proyecto[];
  navigate: (path: string) => void; filtroPeriodo: string; apuestaId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const okrsMeta = okrs.filter((o) =>
    o.metaId === meta.id &&
    (!apuestaId || o.apuestaId === apuestaId) &&
    (filtroPeriodo === "todos" || o.periodo === filtroPeriodo)
  );

  return (
    <div className="mb-4">
      <div className="rounded-lg overflow-hidden" style={{ border: "2px solid #B8C500", backgroundColor: "#FAFCE0" }}>
        <div className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-yellow-50 transition-colors" onClick={() => setExpanded(!expanded)}>
          <BookOpen size={16} color="#7D8900" />
          <div className="flex-1 min-w-0">
            <div className="mb-0.5">
              <span style={{ fontSize: "9px", color: "#7D8900", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Meta Institucional</span>
            </div>
            <p style={{ fontSize: "14px", fontWeight: 800, color: "#000" }}>{meta.nombre}</p>
            <p style={{ fontSize: "11px", color: "#7D8900" }}>
              {meta.areaInstitucional}
              {meta.metricaReferencia ? ` Â· ${meta.metricaReferencia}: ${meta.valorEsperado ?? "-"} ${meta.unidadMedida ?? ""}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: meta.estado === "activa" ? COLORS.green + "20" : "#E5E7EB", color: meta.estado === "activa" ? COLORS.green : "#9CA3AF", fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}>{meta.estado}</span>
            <span style={{ fontSize: "10px", color: "#7D8900" }}>{okrsMeta.length} objetivos</span>
            {expanded ? <ChevronDown size={15} color="#7D8900" /> : <ChevronRight size={15} color="#7D8900" />}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="mt-1">
          {okrsMeta.length === 0 ? (
            <div className="ml-6 mb-2 px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: "#F9FAFB", border: "1px dashed #E5E7EB" }}>
              <Target size={12} color="#D1D5DB" />
              <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Sin Objetivos asociados</span>
            </div>
          ) : (
            okrsMeta.map((o) => <ObjetivoNode key={o.id} okr={o} proyectos={proyectos} navigate={navigate} filtroPeriodo={filtroPeriodo} parent="meta" />)
          )}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export function JerarquiaEstrategica() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { apuestas, metas, okrs, proyectos } = useData();
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [vistaFiltro, setVistaFiltro] = useState<"todos" | "apuestas" | "metas">("todos");

  const canCreateApuesta = usuario?.rol === "director" || usuario?.rol === "administrador";
  const canCreateMeta = canCreateApuesta;

  const q = busqueda.toLowerCase().trim();

  const proyectoMatchQ = (p: Proyecto) =>
    !q || p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q) ||
    p.tutores.some((t) => t.toLowerCase().includes(q));

  const krMatchQ = (kr: KeyResult) =>
    !q || kr.enunciado.toLowerCase().includes(q) || kr.metrica.toLowerCase().includes(q) ||
    proyectos.filter((p) => p.krId === kr.id).some(proyectoMatchQ);

  const okrMatchQ = (o: OKR) =>
    !q || o.objetivo.toLowerCase().includes(q) || o.departamento.toLowerCase().includes(q) ||
    o.keyResults.some(krMatchQ) ||
    proyectos.filter((p) => p.okrIds?.includes(o.id)).some(proyectoMatchQ);

  const apuestaMatchQ = (a: ApuestaEstrategica) =>
    !q || a.nombre.toLowerCase().includes(q) || a.descripcion.toLowerCase().includes(q) ||
    okrs.filter((o) => o.apuestaId === a.id).some(okrMatchQ);

  const metaMatchQ = (m: MetaInstitucional) =>
    !q || m.nombre.toLowerCase().includes(q) || m.descripcion.toLowerCase().includes(q) ||
    okrs.filter((o) => o.metaId === m.id).some(okrMatchQ);

  const filteredApuestas = useMemo(() => apuestas.filter(apuestaMatchQ), [apuestas, okrs, proyectos, q]);
  const filteredMetas = useMemo(() => metas.filter(metaMatchQ), [metas, okrs, proyectos, q]);

  const totalOKRsActivos = okrs.filter(
    (o) => o.estado === "activo" && (filtroPeriodo === "todos" || o.periodo === filtroPeriodo)
  ).length;
  const totalKRs = okrs.reduce((s, o) => s + o.keyResults.length, 0);

  const PERIODOS_FILTER = ["todos", "2024-II", "2025-I", "2025-II", "2026-I"];

  const showApuestas = vistaFiltro === "todos" || vistaFiltro === "apuestas";
  const showMetas = vistaFiltro === "metas";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── HEADER STICKY ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white" style={{ borderBottom: "1.5px solid #E5E7EB", zIndex: 10 }}>
        {/* Stats + leyenda */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: 4 }}>
              {apuestas.length} apuestas · {metas.length} metas · {totalOKRsActivos} objetivos activos · {totalKRs} KRs · {proyectos.filter((p) => p.estado === "activo").length} proyectos activos
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: Flag, color: "#E4EB60", bg: "#000", label: "Apuesta" },
                { icon: BookOpen, color: "#7D8900", bg: "#FAFCE0", label: "Meta" },
                { icon: Target, color: COLORS.blue, bg: "#EEF2FF", label: "Objetivo" },
                { icon: KeyRound, color: COLORS.blue, bg: "#EEF2FF", label: "KR" },
                { icon: FolderKanban, color: COLORS.green, bg: "#ECFDF5", label: "Proyecto" },
              ].map(({ icon: Icon, color, bg, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon size={10} color={color} />
                  </div>
                  <span style={{ fontSize: "11px", color: "#374151" }}>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <Sparkles size={11} color={COLORS.blue} />
                <span style={{ fontSize: "11px", color: "#374151" }}>% Impacto IA</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-wrap">
            {canCreateMeta && (
              <button onClick={() => navigate("/jerarquia/meta/nueva")} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: "#B8C500", color: "#fff", fontSize: "12px", fontWeight: 700 }}>
                <Plus size={13} /> Nueva Meta
              </button>
            )}
            {canCreateApuesta && (
              <button onClick={() => navigate("/jerarquia/apuesta/nueva")} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: "#000", color: "#fff", fontSize: "12px", fontWeight: 700 }}>
                <Plus size={13} /> Nueva Apuesta
              </button>
            )}
          </div>
        </div>

        {/* Controles de filtro */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0 rounded-lg overflow-hidden" style={{ border: "1.5px solid #000" }}>
            {[
              { val: "todos", label: "Todos" },
              { val: "apuestas", label: "Apuestas" },
              { val: "metas", label: "Metas" },
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setVistaFiltro(f.val as typeof vistaFiltro)}
                style={{
                  padding: "6px 14px", fontSize: "11px", fontWeight: 700,
                  backgroundColor: vistaFiltro === f.val ? "#000" : "#fff",
                  color: vistaFiltro === f.val ? "#E4EB60" : "#374151",
                  borderRight: "1px solid #000",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0 rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
            {PERIODOS_FILTER.map((p) => (
              <button
                key={p}
                onClick={() => setFiltroPeriodo(p)}
                style={{
                  padding: "6px 10px", fontSize: "11px", fontWeight: 700,
                  backgroundColor: filtroPeriodo === p ? COLORS.blue : "#fff",
                  color: filtroPeriodo === p ? "#fff" : "#374151",
                  borderRight: "1px solid #E5E7EB",
                  transition: "all 0.15s",
                }}
              >
                {p === "todos" ? "Todos" : p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2" style={{ border: "1.5px solid #E5E7EB", minWidth: 220 }}>
            <Search size={13} color="#9CA3AF" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar proyecto, KR, objetivo..."
              style={{ border: "none", outline: "none", fontSize: "12px", flex: 1, backgroundColor: "transparent" }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={{ color: "#9CA3AF" }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO SCROLLEABLE ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {q && filteredApuestas.length === 0 && filteredMetas.length === 0 && (
          <div className="py-16 text-center">
            <Search size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron resultados para "{busqueda}"</p>
            <button onClick={() => setBusqueda("")} className="mt-2" style={{ color: COLORS.blue, fontSize: "12px", fontWeight: 600 }}>Limpiar búsqueda</button>
          </div>
        )}

        {showApuestas && filteredApuestas.length > 0 && (
          <div className="mb-4">
            {vistaFiltro === "todos" && (
              <div className="flex items-center gap-2 mb-3">
                <Flag size={14} color="#000" />
                <h2 style={{ fontSize: "11px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Apuestas Estratégicas ({filteredApuestas.length})
                </h2>
              </div>
            )}
            {filteredApuestas.map((a) => (
              <ApuestaNode key={a.id} apuesta={a} metas={metas} okrs={okrs} proyectos={proyectos} navigate={navigate} filtroPeriodo={filtroPeriodo} />
            ))}
          </div>
        )}

        {showMetas && filteredMetas.length > 0 && (
          <div className="mb-4">
            {vistaFiltro === "todos" && (
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} color="#7D8900" />
                <h2 style={{ fontSize: "11px", fontWeight: 800, color: "#7D8900", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Metas Institucionales ({filteredMetas.length})
                </h2>
              </div>
            )}
            {filteredMetas.map((m) => (
              <MetaNode key={m.id} meta={m} okrs={okrs} proyectos={proyectos} navigate={navigate} filtroPeriodo={filtroPeriodo} />
            ))}
          </div>
        )}

        <div className="mt-4 rounded-lg p-4 flex flex-wrap items-center gap-6" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          {[
            { label: "Apuestas", value: apuestas.length, color: "#000" },
            { label: "Metas", value: metas.length, color: "#B8C500" },
            { label: "Objetivos activos", value: okrs.filter((o) => o.estado === "activo").length, color: COLORS.blue },
            { label: "Key Results", value: totalKRs, color: COLORS.blue },
            { label: "Proyectos activos", value: proyectos.filter((p) => p.estado === "activo").length, color: COLORS.green },
            { label: "KRs sin proyectos", value: okrs.flatMap((o) => o.keyResults).filter((kr) => !proyectos.some((p) => p.krId === kr.id)).length, color: COLORS.orange },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              {i > 0 && <div style={{ width: 1, height: 36, backgroundColor: "#E5E7EB" }} />}
              <div className="text-center">
                <p style={{ fontSize: "20px", fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
