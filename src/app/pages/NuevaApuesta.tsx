import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Flag, Save, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { EstadoApuesta } from "../data/mockData";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
};

const AREAS = [
  "Facultad de Ingeniería, Diseño y Ciencias Aplicadas",
  "Dirección de Investigaciones",
  "Escuela TDI",
  "Vicerrectoría Académica",
  "Dirección de Extensión",
];

type Errors = Partial<Record<string, string>>;

export function NuevaApuesta() {
  const navigate = useNavigate();
  const { addApuesta } = useData();
  const { usuario } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    areaInstitucional: AREAS[0],
    fechaInicio: "",
    fechaCierre: "",
    estado: "activa" as EstadoApuesta,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  // Solo director o admin
  const canCreate = usuario?.rol === "director" || usuario?.rol === "administrador";

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (form.nombre.trim().length > 0 && form.nombre.trim().length < 10) e.nombre = "Mínimo 10 caracteres.";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!form.fechaInicio) e.fechaInicio = "La fecha de inicio es obligatoria.";
    if (!form.fechaCierre) e.fechaCierre = "La fecha de cierre es obligatoria.";
    if (form.fechaInicio && form.fechaCierre && form.fechaCierre <= form.fechaInicio)
      e.fechaCierre = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addApuesta(form);
    setSaved(true);
    setTimeout(() => navigate("/jerarquia"), 1200);
  };

  if (!canCreate) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} color={COLORS.orange} />
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Acceso restringido</h2>
        <p style={{ color: "#717182" }}>Solo el Director de Escuela o el Administrador pueden crear Apuestas Estratégicas.</p>
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.blue }}>
            <Flag size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Nueva Apuesta Estratégica</h1>
            <p style={{ fontSize: "12px", color: "#717182" }}>Define una apuesta institucional para la Escuela TDI</p>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="mb-4 px-4 py-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: "#ECFDF5", border: "1.5px solid #4CB979" }}>
          <AlertCircle size={16} color={COLORS.green} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#065F46" }}>Apuesta creada exitosamente. Redirigiendo...</span>
        </div>
      )}

      <div className="bg-white rounded-xl p-8 space-y-6" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {/* Nombre */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Nombre de la apuesta <span style={{ color: COLORS.orange }}>*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej: Innovación Curricular y Digitalización Académica"
            style={{
              width: "100%", padding: "10px 14px", fontSize: "14px", border: `1.5px solid ${errors.nombre ? COLORS.orange : "#E5E7EB"}`,
              borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif",
            }}
          />
          {errors.nombre && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.nombre}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Descripción <span style={{ color: COLORS.orange }}>*</span>
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Describe el alcance y propósito de esta apuesta estratégica..."
            rows={4}
            style={{
              width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.descripcion ? COLORS.orange : "#E5E7EB"}`,
              borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical",
            }}
          />
          {errors.descripcion && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.descripcion}</p>}
        </div>

        {/* Área institucional */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Área institucional <span style={{ color: COLORS.orange }}>*</span>
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

        {/* Fechas + Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fecha inicio <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={(e) => set("fechaInicio", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.fechaInicio ? COLORS.orange : "#E5E7EB"}`,
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif",
              }}
            />
            {errors.fechaInicio && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.fechaInicio}</p>}
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fecha cierre <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <input
              type="date"
              value={form.fechaCierre}
              onChange={(e) => set("fechaCierre", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.fechaCierre ? COLORS.orange : "#E5E7EB"}`,
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif",
              }}
            />
            {errors.fechaCierre && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.fechaCierre}</p>}
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Estado inicial
            </label>
            <select
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px", border: "1.5px solid #E5E7EB",
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff",
              }}
            >
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: "#EEF2FF", border: "1.5px solid #C7D2FE" }}>
          <AlertCircle size={16} color={COLORS.blue} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: "12px", color: "#3730A3", lineHeight: 1.6 }}>
            Las Apuestas Estratégicas representan los ejes de transformación de la Escuela TDI. Cada apuesta agrupa Metas Institucionales que a su vez se operativizan mediante OKRs y Proyectos.
          </p>
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
              backgroundColor: saved ? COLORS.green : COLORS.blue, border: "none", borderRadius: 8, cursor: saved ? "default" : "pointer",
            }}
          >
            <Save size={15} />
            {saved ? "Guardado" : "Crear Apuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}
