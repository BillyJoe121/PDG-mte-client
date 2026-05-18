import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, Flag, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { strategicBetsApi } from "../services/strategicApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
};

type Errors = Partial<Record<"name" | "description" | "endDate", string>>;

export function NuevaApuesta() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const canCreate = usuario?.rol === "director" || usuario?.rol === "administrador";
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await strategicBetsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Apuesta estrategica creada");
      navigate("/jerarquia");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la apuesta");
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} color={COLORS.orange} />
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Acceso restringido</h2>
        <p style={{ color: "#717182" }}>Solo direccion o administracion pueden crear apuestas estrategicas.</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mt-2" style={{ color: COLORS.blue, fontWeight: 700, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.blue }}>
            <Flag size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Nueva Apuesta Estrategica</h1>
            <p style={{ fontSize: "12px", color: "#717182" }}>Registra una linea de accion de largo plazo.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 space-y-6" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>
            Nombre <span style={{ color: COLORS.orange }}>*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej: Innovacion Curricular y Digitalizacion Academica"
            style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1.5px solid ${errors.name ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none" }}
          />
          {errors.name && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.name}</p>}
        </div>

        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>
            Descripcion <span style={{ color: COLORS.orange }}>*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            placeholder="Describe el alcance y proposito de esta apuesta estrategica."
            style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.description ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", resize: "vertical" }}
          />
          {errors.description && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Fecha inicio</label>
            <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Fecha cierre</label>
            <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.endDate ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none" }} />
            {errors.endDate && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.endDate}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 8, backgroundColor: "#fff" }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 700, color: "#fff", backgroundColor: COLORS.blue, borderRadius: 8 }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Crear Apuesta
          </button>
        </div>
      </form>
    </div>
  );
}
