import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, BookOpen, Save, AlertCircle, Check } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { PERIODOS } from "../data/mockData";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
};

const AREAS = [
  "Escuela TDI",
  "Facultad de Ingeniería, Diseño y Ciencias Aplicadas",
  "Dirección de Investigaciones",
  "Vicerrectoría Académica",
  "Dirección de Internacionalización",
  "Dirección de Extensión",
];

type Errors = Partial<Record<string, string>>;

export function NuevaMeta() {
  const navigate = useNavigate();
  const { apuestas, addMeta } = useData();
  const { usuario } = useAuth();

  // Solo director y administrador crean Metas (vienen de la junta directiva)
  const canCreate = usuario?.rol === "director" || usuario?.rol === "administrador";

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    areaInstitucional: AREAS[0],
    estado: "activa" as "activa" | "inactiva",
    metricaReferencia: "",
    valorEsperado: "",
    unidadMedida: "",
    periodo: PERIODOS[1] ?? "2025-I",
    apuestaIds: [] as string[],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!form.metricaReferencia.trim()) e.metricaReferencia = "La metrica de referencia es obligatoria.";
    if (!form.valorEsperado || Number(form.valorEsperado) <= 0) e.valorEsperado = "Ingresa un valor esperado mayor a cero.";
    if (!form.unidadMedida.trim()) e.unidadMedida = "La unidad de medida es obligatoria.";
    if (form.apuestaIds.length === 0) e.apuestaIds = "Vincula al menos una apuesta estrategica.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleApuesta = (id: string) => {
    setForm((prev) => ({
      ...prev,
      apuestaIds: prev.apuestaIds.includes(id)
        ? prev.apuestaIds.filter((apuestaId) => apuestaId !== id)
        : [...prev.apuestaIds, id],
    }));
    setErrors((prev) => ({ ...prev, apuestaIds: "" }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addMeta({
      nombre: form.nombre,
      descripcion: form.descripcion,
      estado: form.estado,
      areaInstitucional: form.areaInstitucional,
      metricaReferencia: form.metricaReferencia,
      valorEsperado: Number(form.valorEsperado),
      unidadMedida: form.unidadMedida,
      periodo: form.periodo,
      apuestaIds: form.apuestaIds,
    });
    setSaved(true);
    setTimeout(() => navigate("/jerarquia"), 1200);
  };

  if (!canCreate) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} color={COLORS.orange} />
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Acceso restringido</h2>
        <p style={{ color: "#717182" }}>Solo el Director o Administrador pueden registrar Metas Institucionales en la plataforma.</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mt-2" style={{ color: COLORS.blue, fontWeight: 700, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#B8C500" }}>
            <BookOpen size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Nueva Meta Institucional</h1>
            <p style={{ fontSize: "12px", color: "#717182" }}>Registra una Meta propuesta por la Junta Directiva de la Universidad</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: "#ECFDF5", border: "1.5px solid #4CB979" }}>
          <AlertCircle size={16} color={COLORS.green} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#065F46" }}>Meta creada exitosamente. Redirigiendo...</span>
        </div>
      )}

      <div className="bg-white rounded-xl p-8 space-y-6" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

        {/* Aviso conceptual */}
        <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: "#FAFCE0", border: "1.5px solid #B8C500" }}>
          <BookOpen size={16} color="#7D8900" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: "12px", color: "#7D8900", lineHeight: 1.6 }}>
            Las Metas Institucionales son enunciados amplios de intención, propuestos por la Junta Directiva de la Universidad. No contienen cifras ni indicadores de medición —  esos son responsabilidad de los OKRs. El Director los registra en la plataforma tal como los recibe.
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Enunciado de la meta <span style={{ color: COLORS.orange }}>*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder='Ej: "Renovar y modernizar la propuesta curricular de la Escuela TDI"'
            style={{
              width: "100%", padding: "10px 14px", fontSize: "14px",
              border: `1.5px solid ${errors.nombre ? COLORS.orange : "#E5E7EB"}`,
              borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif",
            }}
          />
          {errors.nombre && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.nombre}</p>}
          <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 4 }}>
            Debe ser un enunciado de intención, sin porcentajes ni cifras. Las metas son amplias y orientadoras.
          </p>
        </div>

        {/* Descripción */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Descripción / Contexto <span style={{ color: COLORS.orange }}>*</span>
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Describe el alcance, contexto y relevancia de esta meta para la Escuela..."
            rows={3}
            style={{
              width: "100%", padding: "10px 14px", fontSize: "13px",
              border: `1.5px solid ${errors.descripcion ? COLORS.orange : "#E5E7EB"}`,
              borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical",
            }}
          />
          {errors.descripcion && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.descripcion}</p>}
        </div>

        {/* Medicion */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Metrica de referencia <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <input
              type="text"
              value={form.metricaReferencia}
              onChange={(e) => set("metricaReferencia", e.target.value)}
              placeholder="Ej: Cursos renovados, publicaciones Q1/Q2"
              style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.metricaReferencia ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif" }}
            />
            {errors.metricaReferencia && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.metricaReferencia}</p>}
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Valor esperado <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <input
              type="number"
              min={0}
              value={form.valorEsperado}
              onChange={(e) => set("valorEsperado", e.target.value)}
              style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.valorEsperado ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif" }}
            />
            {errors.valorEsperado && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.valorEsperado}</p>}
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Unidad <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <input
              type="text"
              value={form.unidadMedida}
              onChange={(e) => set("unidadMedida", e.target.value)}
              placeholder="%, cursos"
              style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.unidadMedida ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif" }}
            />
            {errors.unidadMedida && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.unidadMedida}</p>}
          </div>
        </div>

        {/* Apuestas vinculadas */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Apuestas estrategicas vinculadas <span style={{ color: COLORS.orange }}>*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {apuestas.map((apuesta) => {
              const selected = form.apuestaIds.includes(apuesta.id);
              return (
                <button key={apuesta.id} type="button" onClick={() => toggleApuesta(apuesta.id)}
                  className="text-left flex items-start gap-3 p-3 rounded-lg transition-all"
                  style={{ border: `1.5px solid ${selected ? "#B8C500" : "#E5E7EB"}`, backgroundColor: selected ? "#FAFCE0" : "#fff" }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selected ? "#B8C500" : "#F3F4F6" }}>
                    {selected && <Check size={12} color="#fff" />}
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#000", lineHeight: 1.35 }}>{apuesta.nombre}</p>
                    <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 2 }}>{apuesta.estado} - {apuesta.areaInstitucional}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.apuestaIds && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.apuestaIds}</p>}
        </div>

        {/* Area + Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Area institucional
            </label>
            <select
              value={form.areaInstitucional}
              onChange={(e) => set("areaInstitucional", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px", border: "1.5px solid #E5E7EB",
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff",
              }}
            >
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Estado
            </label>
            <select
              value={form.estado}
              onChange={(e) => set("estado", e.target.value as "activa" | "inactiva")}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px", border: "1.5px solid #E5E7EB",
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff",
              }}
            >
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Periodo
            </label>
            <select
              value={form.periodo}
              onChange={(e) => set("periodo", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px", border: "1.5px solid #E5E7EB",
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff",
              }}
            >
              {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 8, backgroundColor: "#fff" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saved}
            className="flex items-center gap-2"
            style={{
              padding: "10px 24px", fontSize: "13px", fontWeight: 700, color: "#fff",
              backgroundColor: saved ? COLORS.green : "#B8C500", border: "none", borderRadius: 8, cursor: saved ? "default" : "pointer",
            }}
          >
            <Save size={15} />
            {saved ? "Guardada" : "Crear Meta"}
          </button>
        </div>
      </div>
    </div>
  );
}
