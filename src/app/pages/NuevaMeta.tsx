import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, BookOpen, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { measurementUnitsApi, type MeasurementUnit } from "../services/catalogsApi";
import { goalsApi } from "../services/strategicApi";
import { getGoalValueInput, validateGoalForm, type GoalFormErrors, type GoalFormValues } from "../utils/goalForm";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
};

export function NuevaMeta() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const canCreate = usuario?.rol === "admin";
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [form, setForm] = useState<GoalFormValues>({
    name: "",
    description: "",
    referenceIndicator: "",
    expectedValue: "",
    measurementUnitId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    measurementUnitsApi.list()
      .then((data) => setUnits(data.filter((unit) => unit.active)))
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las unidades"))
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next = validateGoalForm(form, units);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await goalsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        referenceIndicator: form.referenceIndicator.trim(),
        expectedValue: Number(form.expectedValue),
        measurementUnitId: Number(form.measurementUnitId),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Meta institucional creada");
      navigate("/jerarquia");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la meta");
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} color={COLORS.orange} />
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Acceso restringido</h2>
        <p style={{ color: "#717182" }}>Solo direccion o administracion pueden registrar metas institucionales.</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mt-2" style={{ color: COLORS.blue, fontWeight: 700, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  const selectedUnit = units.find((unit) => String(unit.id) === form.measurementUnitId);
  const valueInput = getGoalValueInput(selectedUnit);

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
            <p style={{ fontSize: "12px", color: "#717182" }}>Captura un enunciado del plan de desarrollo.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 space-y-6" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Nombre <span style={{ color: COLORS.orange }}>*</span></label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Renovar y modernizar la propuesta curricular" style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1.5px solid ${errors.name ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none" }} />
          {errors.name && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.name}</p>}
        </div>

        <div>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Descripcion <span style={{ color: COLORS.orange }}>*</span></label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Describe alcance, contexto y relevancia." style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.description ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", resize: "vertical" }} />
          {errors.description && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_180px] gap-4">
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Indicador de referencia <span style={{ color: COLORS.orange }}>*</span></label>
            <input value={form.referenceIndicator} onChange={(e) => set("referenceIndicator", e.target.value)} placeholder="Ej: Cursos renovados" style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.referenceIndicator ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none" }} />
            {errors.referenceIndicator && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.referenceIndicator}</p>}
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Valor <span style={{ color: COLORS.orange }}>*</span></label>
            {valueInput.kind === "boolean" ? (
              <select aria-label="Valor esperado" value={form.expectedValue} onChange={(e) => set("expectedValue", e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.expectedValue ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", backgroundColor: "#fff" }}>
                <option value="">Selecciona</option>
                <option value="1">Si</option>
                <option value="0">No</option>
              </select>
            ) : (
              <input aria-label="Valor esperado" type="number" min={valueInput.min} max={valueInput.max} step={valueInput.step} value={form.expectedValue} onChange={(e) => set("expectedValue", e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.expectedValue ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none" }} />
            )}
            {errors.expectedValue && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.expectedValue}</p>}
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Unidad <span style={{ color: COLORS.orange }}>*</span></label>
            <select value={form.measurementUnitId} onChange={(e) => set("measurementUnitId", e.target.value)} disabled={loading} style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.measurementUnitId ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", backgroundColor: "#fff" }}>
              <option value="">Selecciona</option>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
            {errors.measurementUnitId && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.measurementUnitId}</p>}
          </div>
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
          <button type="submit" disabled={saving || loading} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 700, color: "#fff", backgroundColor: "#B8C500", borderRadius: 8 }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Crear Meta
          </button>
        </div>
      </form>
    </div>
  );
}
