import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, FolderKanban, Save, AlertCircle, Check } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import {
  DEPARTAMENTOS, usuarios, TipoProyecto, EstadoProyecto, ImpactoIA,
} from "../data/mockData";
import { ImpactoIAPanel } from "../components/ImpactoIAPanel";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
};

const TIPOS_PROYECTO: { value: TipoProyecto; label: string; color: string; desc: string }[] = [
  { value: "grado", label: "Proyecto de Grado", color: COLORS.blue, desc: "Trabajo de grado de estudiantes de pregrado" },
  { value: "investigacion", label: "Investigación", color: COLORS.green, desc: "Proyecto de investigación con grupos o semilleros" },
  { value: "extension", label: "Extensión", color: COLORS.orange, desc: "Proyecto con impacto externo o comunitario" },
  { value: "macroproyecto", label: "Macroproyecto", color: "#7C3AED", desc: "Iniciativa interdisciplinar de gran escala" },
];

const CONTRIBUCION_TIPOS = [
  { value: "directa", label: "Directa", desc: "Contribuye directamente al logro del KR" },
  { value: "indirecta", label: "Indirecta", desc: "Contribuye de forma indirecta o complementaria" },
  { value: "soporte", label: "Soporte", desc: "Apoya el desarrollo del KR sin ser su objetivo principal" },
];

type Errors = Partial<Record<string, string>>;

export function NuevoProyecto() {
  const navigate = useNavigate();
  const { okrs, addProyecto } = useData();
  const { usuario } = useAuth();

  const canCreate = !!usuario;

  const tutoresDisponibles = usuarios.filter(
    (u) => (u.rol === "tutor" || u.rol === "jefe") && u.estado === "activo"
  );

  const okrsDisponibles = okrs.filter((o) => o.estado === "activo");

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "grado" as TipoProyecto,
    departamento: usuario?.departamento && DEPARTAMENTOS.includes(usuario.departamento) ? usuario.departamento : DEPARTAMENTOS[0],
    fechaInicio: "",
    fechaCierre: "",
    periodoInicio: "2025-I",
    periodoFin: "2025-I",
    estado: "borrador" as EstadoProyecto,
    contribucionTipo: "directa" as "directa" | "indirecta" | "soporte",
    tutores: [] as string[],
    krId: "",
    okrIds: [] as string[],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const [impactoKR, setImpactoKR] = useState<ImpactoIA | undefined>(undefined);

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "krId") setImpactoKR(undefined);
  };

  const toggleOKR = (okrId: string) => {
    setForm((prev) => ({
      ...prev,
      okrIds: prev.okrIds.includes(okrId)
        ? prev.okrIds.filter((id) => id !== okrId)
        : [...prev.okrIds, okrId],
    }));
    setErrors((prev) => ({ ...prev, okrIds: "" }));
  };

  const toggleTutor = (nombre: string) => {
    setForm((prev) => ({
      ...prev,
      tutores: prev.tutores.includes(nombre)
        ? prev.tutores.filter((t) => t !== nombre)
        : [...prev.tutores, nombre],
    }));
    setErrors((prev) => ({ ...prev, tutores: "" }));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!form.fechaInicio) e.fechaInicio = "La fecha de inicio es obligatoria.";
    if (!form.fechaCierre) e.fechaCierre = "La fecha de cierre es obligatoria.";
    if (form.fechaInicio && form.fechaCierre && form.fechaCierre <= form.fechaInicio)
      e.fechaCierre = "La fecha de cierre debe ser posterior al inicio.";
    if (form.tutores.length === 0) e.tutores = "Selecciona al menos un tutor.";
    if (form.estado !== "borrador" && form.okrIds.length === 0) e.okrIds = "Selecciona al menos un OKR activo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const okrPrincipal = okrs.find((o) => o.id === form.okrIds[0]);
    addProyecto({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      departamento: form.departamento,
      fechaInicio: form.fechaInicio,
      fechaCierre: form.fechaCierre,
      periodoInicio: form.periodoInicio,
      periodoFin: form.periodoFin,
      estado: form.estado,
      contribucionTipo: form.contribucionTipo,
      tutores: form.tutores,
      krId: form.krId || okrPrincipal?.keyResults[0]?.id || "",
      okrIds: form.okrIds,
      impactoKR,
    });
    setSaved(true);
    setTimeout(() => navigate("/proyectos"), 1200);
  };

  if (!canCreate) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} color={COLORS.orange} />
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Debes iniciar sesión</h2>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mt-2" style={{ color: COLORS.blue, fontWeight: 700, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  const tipoColor = TIPOS_PROYECTO.find((t) => t.value === form.tipo)?.color ?? COLORS.blue;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tipoColor }}>
            <FolderKanban size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Nuevo Proyecto</h1>
            <p style={{ fontSize: "12px", color: "#717182" }}>Cada proyecto aporta a un único Resultado Clave (KR).</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: "#ECFDF5", border: "1.5px solid #4CB979" }}>
          <AlertCircle size={16} color={COLORS.green} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#065F46" }}>Proyecto creado exitosamente. Redirigiendo...</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Sección 1: Información básica */}
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #5454E9", paddingBottom: 8 }}>
            Información básica
          </h2>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Nombre del proyecto <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <input
              type="text" value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Sistema de tutoría inteligente con IA generativa"
              style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1.5px solid ${errors.nombre ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif" }}
            />
            {errors.nombre && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.nombre}</p>}
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Descripción <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <textarea
              value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)}
              placeholder="Describe el alcance, metodología y objetivo principal del proyecto..." rows={3}
              style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.descripcion ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical" }}
            />
            {errors.descripcion && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.descripcion}</p>}
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tipo de proyecto <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TIPOS_PROYECTO.map((t) => {
                const sel = form.tipo === t.value;
                return (
                  <button key={t.value} type="button" onClick={() => setForm((prev) => ({ ...prev, tipo: t.value }))}
                    className="p-3 rounded-lg text-left transition-all"
                    style={{ border: `2px solid ${sel ? t.color : "#E5E7EB"}`, backgroundColor: sel ? t.color + "12" : "#fff" }}>
                    <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: t.color }} />
                    <p style={{ fontSize: "11px", fontWeight: 700, color: sel ? t.color : "#374151" }}>{t.label}</p>
                    <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 2, lineHeight: 1.4 }}>{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Departamento</label>
              <select value={form.departamento} onChange={(e) => set("departamento", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}>
                {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado inicial</label>
              <select value={form.estado} onChange={(e) => set("estado", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}>
                <option value="borrador">Borrador</option>
                <option value="activo">Activo</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de contribución</label>
              <select value={form.contribucionTipo} onChange={(e) => set("contribucionTipo", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}>
                {CONTRIBUCION_TIPOS.map((c) => <option key={c.value} value={c.value}>{c.label} — {c.desc}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha de inicio <span style={{ color: COLORS.orange }}>*</span></label>
              <input type="date" value={form.fechaInicio} onChange={(e) => set("fechaInicio", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.fechaInicio ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif" }}/>
              {errors.fechaInicio && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.fechaInicio}</p>}
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha de cierre <span style={{ color: COLORS.orange }}>*</span></label>
              <input type="date" value={form.fechaCierre} onChange={(e) => set("fechaCierre", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.fechaCierre ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif" }}/>
              {errors.fechaCierre && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.fechaCierre}</p>}
            </div>
          </div>
        </div>

        {/* Sección 2: Tutores */}
        <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #5454E9", paddingBottom: 8 }}>
            Tutores / Profesores <span style={{ color: COLORS.orange }}>*</span>
          </h2>
          <p style={{ fontSize: "11px", color: "#717182" }}>Selecciona uno o más tutores responsables del proyecto.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tutoresDisponibles.map((u) => {
              const selected = form.tutores.includes(u.nombre);
              return (
                <button key={u.id} type="button" onClick={() => toggleTutor(u.nombre)}
                  className="text-left flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{ border: `1.5px solid ${selected ? COLORS.blue : "#E5E7EB"}`, backgroundColor: selected ? "#EEF2FF" : "#fff" }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selected ? COLORS.blue : "#F3F4F6", border: `2px solid ${selected ? COLORS.blue : "#D1D5DB"}` }}>
                    {selected && <Check size={12} color="#fff" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#000" }}>{u.nombre}</p>
                    <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{u.departamento} · {u.rol === "jefe" ? "Jefe de Dpto." : "Tutor"}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.tutores && <p style={{ fontSize: "11px", color: COLORS.orange }}>{errors.tutores}</p>}
        </div>

        {/* Sección 3: OKRs vinculados */}
        <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #5454E9", paddingBottom: 8 }}>
            OKRs vinculados
          </h2>
          <p style={{ fontSize: "11px", color: "#717182" }}>
            Vincula el proyecto a uno o mas OKRs activos. Puedes marcar un KR principal para mantener trazabilidad detallada.
          </p>

          {okrsDisponibles.length === 0 ? (
            <p style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>No hay objetivos activos disponibles.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {okrsDisponibles.map((o) => {
                const okrSelected = form.okrIds.includes(o.id);
                return (
                <div key={o.id} className="rounded-lg" style={{ border: `1.5px solid ${okrSelected ? COLORS.blue : "#E5E7EB"}`, backgroundColor: okrSelected ? "#EEF2FF" : "#FAFAFA" }}>
                  <div className="px-3 py-2 flex items-start gap-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <button type="button" onClick={() => toggleOKR(o.id)} className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: okrSelected ? COLORS.blue : "#fff", border: `2px solid ${okrSelected ? COLORS.blue : "#D1D5DB"}` }}>
                      {okrSelected && <Check size={12} color="#fff" />}
                    </button>
                    <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "11px", fontWeight: 800, color: COLORS.blue, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {o.id} · {o.departamento} · {o.periodo}
                    </p>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", marginTop: 2 }}>{o.objetivo}</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {o.keyResults.map((kr, i) => {
                      const sel = form.krId === kr.id;
                      return (
                        <button key={kr.id} type="button" onClick={() => {
                          if (!form.okrIds.includes(o.id)) toggleOKR(o.id);
                          set("krId", kr.id);
                        }}
                          className="w-full text-left flex items-start gap-2 p-2 rounded transition-all"
                          style={{ border: `1.5px solid ${sel ? COLORS.green : "transparent"}`, backgroundColor: sel ? "#F0FDF4" : "#fff" }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: sel ? COLORS.green : "#fff", border: `2px solid ${sel ? COLORS.green : "#D1D5DB"}` }}>
                            {sel && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fff" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "10px", fontWeight: 700, color: "#374151" }}>KR{i + 1}</p>
                            <p style={{ fontSize: "12px", color: "#000", lineHeight: 1.4 }}>{kr.enunciado || kr.metrica}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );})}
            </div>
          )}
          {errors.okrIds && <p style={{ fontSize: "11px", color: COLORS.orange }}>{errors.okrIds}</p>}
          {errors.krId && <p style={{ fontSize: "11px", color: COLORS.orange }}>{errors.krId}</p>}

          {(() => {
            const krSel = form.krId
              ? okrs.flatMap((o) => o.keyResults).find((k) => k.id === form.krId)
              : null;
            return (
              <ImpactoIAPanel
                titulo="Impacto del Proyecto en el KR"
                tipo="proyecto-kr"
                origen={{ titulo: form.nombre || "Proyecto (sin nombre)", descripcion: form.descripcion }}
                destino={krSel ? { titulo: krSel.enunciado || krSel.metrica } : null}
                value={impactoKR}
                onChange={setImpactoKR}
              />
            );
          })()}
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <button onClick={() => navigate(-1)} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 8, backgroundColor: "#fff" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saved} className="flex items-center gap-2"
            style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 700, color: "#fff", backgroundColor: saved ? COLORS.green : COLORS.blue, border: "none", borderRadius: 8, cursor: saved ? "default" : "pointer" }}>
            <Save size={15} />
            {saved ? "Guardado" : "Crear Proyecto"}
          </button>
        </div>
      </div>
    </div>
  );
}
