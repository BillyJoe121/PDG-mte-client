import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, Loader2, Plus, Save, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { academicPeriodsApi, measurementUnitsApi, type AcademicPeriod, type MeasurementUnit } from "../services/catalogsApi";
import {
  departmentsApi,
  goalsApi,
  objectivesApi,
  strategicBetsApi,
  type Department,
  type Goal,
  type KeyResultRequest,
  type StrategicBet,
} from "../services/strategicApi";
import { DEPARTAMENTOS } from "../data/mockData";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
};

const fallbackDepartments: Department[] = DEPARTAMENTOS.map((name, index) => ({ id: index + 1, name }));

type Errors = Record<string, string>;

interface KrForm {
  name: string;
  description: string;
  metric: string;
  baseValue: string;
  targetValue: string;
  measurementUnitId: string;
}

const emptyKr = (): KrForm => ({
  name: "",
  description: "",
  metric: "",
  baseValue: "0",
  targetValue: "",
  measurementUnitId: "",
});

export function NuevoOKR() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const canCreate = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    departmentId: "",
    academicPeriodId: "",
    goalId: "",
    strategicBetId: "",
  });
  const [krs, setKrs] = useState<KrForm[]>([emptyKr()]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [periodList, goalList, betList, unitList] = await Promise.all([
          academicPeriodsApi.list(),
          goalsApi.list(),
          strategicBetsApi.list(),
          measurementUnitsApi.list(),
        ]);
        setPeriods(periodList.filter((period) => period.status !== "CERRADO"));
        setGoals(goalList);
        setBets(betList.filter((bet) => bet.status !== "CERRADA"));
        setUnits(unitList.filter((unit) => unit.active));
        try {
          setDepartments(await departmentsApi.list());
        } catch {
          setDepartments(fallbackDepartments);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar los catalogos");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const activeDepartments = useMemo(() => {
    if (usuario?.rol === "jefe" && usuario.departamento) {
      return departments.filter((department) => department.name === usuario.departamento);
    }
    return departments;
  }, [departments, usuario]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      departmentId: prev.departmentId || String(activeDepartments[0]?.id ?? ""),
      academicPeriodId: prev.academicPeriodId || String(periods[0]?.id ?? ""),
    }));
  }, [activeDepartments, periods]);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateKr = (index: number, field: keyof KrForm, value: string) => {
    setKrs((prev) => prev.map((kr, i) => (i === index ? { ...kr, [field]: value } : kr)));
    setErrors((prev) => ({ ...prev, [`kr-${index}`]: "" }));
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (!form.departmentId) next.departmentId = "Selecciona un departamento.";
    if (!form.academicPeriodId) next.academicPeriodId = "Selecciona un periodo academico.";
    if (!form.goalId) next.goalId = "Selecciona una meta institucional.";
    if (!form.strategicBetId) next.strategicBetId = "Selecciona una apuesta estrategica.";
    if (krs.length === 0) next.krs = "Define al menos un Key Result.";

    krs.forEach((kr, index) => {
      if (!kr.name.trim()) next[`kr-${index}`] = "El nombre del KR es obligatorio.";
      else if (!kr.description.trim()) next[`kr-${index}`] = "La descripcion del KR es obligatoria.";
      else if (!kr.metric.trim()) next[`kr-${index}`] = "La metrica es obligatoria.";
      else if (kr.targetValue === "" || Number.isNaN(Number(kr.targetValue))) next[`kr-${index}`] = "El valor objetivo es obligatorio.";
      else if (!kr.measurementUnitId) next[`kr-${index}`] = "Selecciona una unidad de medida.";
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toKeyResultRequest = (kr: KrForm): KeyResultRequest => ({
    name: kr.name.trim(),
    description: kr.description.trim(),
    metric: kr.metric.trim(),
    baseValue: Number(kr.baseValue) || 0,
    targetValue: Number(kr.targetValue),
    measurementUnitId: Number(kr.measurementUnitId),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await objectivesApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        departmentId: Number(form.departmentId),
        academicPeriodId: Number(form.academicPeriodId),
        goalId: Number(form.goalId),
        strategicBetId: Number(form.strategicBetId),
        keyResults: krs.map(toKeyResultRequest),
      });
      toast.success("Objetivo creado");
      navigate("/okrs");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el objetivo");
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} color={COLORS.orange} />
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Acceso restringido</h2>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mt-2" style={{ color: COLORS.blue, fontWeight: 700, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.blue }}>
            <Target size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Nuevo Objetivo</h1>
            <p style={{ fontSize: "12px", color: "#717182" }}>Asocialo a una apuesta, una meta, un departamento y un periodo.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16" style={{ color: "#717182", fontSize: "13px", fontWeight: 800 }}>
          <Loader2 size={18} className="mr-2 animate-spin" /> Cargando catalogos...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 750, color: "#111827", textTransform: "uppercase", borderBottom: "1px solid #D9DEE8", paddingBottom: 8 }}>Datos del Objetivo</h2>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Nombre <span style={{ color: COLORS.orange }}>*</span></label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1.5px solid ${errors.name ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none" }} />
              {errors.name && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.name}</p>}
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Descripcion <span style={{ color: COLORS.orange }}>*</span></label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1.5px solid ${errors.description ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", resize: "vertical" }} />
              {errors.description && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldSelect label="Departamento" value={form.departmentId} error={errors.departmentId} onChange={(value) => set("departmentId", value)} options={activeDepartments.map((department) => ({ value: department.id, label: department.name }))} />
              <FieldSelect label="Periodo academico" value={form.academicPeriodId} error={errors.academicPeriodId} onChange={(value) => set("academicPeriodId", value)} options={periods.map((period) => ({ value: period.id, label: period.name }))} />
              <FieldSelect label="Meta institucional" value={form.goalId} error={errors.goalId} onChange={(value) => set("goalId", value)} options={goals.map((goal) => ({ value: goal.id, label: goal.name }))} />
              <FieldSelect label="Apuesta estrategica" value={form.strategicBetId} error={errors.strategicBetId} onChange={(value) => set("strategicBetId", value)} options={bets.map((bet) => ({ value: bet.id, label: bet.name }))} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: "13px", fontWeight: 750, color: "#111827", textTransform: "uppercase", borderBottom: "1px solid #D9DEE8", paddingBottom: 8, flex: 1, marginRight: 16 }}>Key Results</h2>
              <button type="button" onClick={() => setKrs((prev) => [...prev, emptyKr()])} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}>
                <Plus size={14} /> Agregar KR
              </button>
            </div>
            {errors.krs && <p style={{ fontSize: "11px", color: COLORS.orange }}>{errors.krs}</p>}
            {krs.map((kr, index) => (
              <div key={index} className="rounded-lg p-4 space-y-3" style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "11px", fontWeight: 800, color: COLORS.blue }}>KR {index + 1}</span>
                  {krs.length > 1 && (
                    <button type="button" onClick={() => setKrs((prev) => prev.filter((_, i) => i !== index))} title="Eliminar KR">
                      <Trash2 size={15} color={COLORS.orange} />
                    </button>
                  )}
                </div>
                {errors[`kr-${index}`] && <p style={{ fontSize: "11px", color: COLORS.orange }}>{errors[`kr-${index}`]}</p>}
                <input value={kr.name} onChange={(e) => updateKr(index, "name", e.target.value)} placeholder="Nombre del KR" style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", backgroundColor: "#fff" }} />
                <textarea value={kr.description} onChange={(e) => updateKr(index, "description", e.target.value)} placeholder="Descripcion" rows={2} style={{ width: "100%", padding: "9px 12px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", backgroundColor: "#fff", resize: "vertical" }} />
                <input value={kr.metric} onChange={(e) => updateKr(index, "metric", e.target.value)} placeholder="Metrica" style={{ width: "100%", padding: "9px 12px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", backgroundColor: "#fff" }} />
                <div className="grid grid-cols-1 sm:grid-cols-[120px_120px_1fr] gap-3">
                  <input type="number" value={kr.baseValue} onChange={(e) => updateKr(index, "baseValue", e.target.value)} placeholder="Valor base" style={{ padding: "9px 12px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", backgroundColor: "#fff" }} />
                  <input type="number" value={kr.targetValue} onChange={(e) => updateKr(index, "targetValue", e.target.value)} placeholder="Valor objetivo" style={{ padding: "9px 12px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", backgroundColor: "#fff" }} />
                  <select value={kr.measurementUnitId} onChange={(e) => updateKr(index, "measurementUnitId", e.target.value)} style={{ padding: "9px 12px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", backgroundColor: "#fff" }}>
                    <option value="">Unidad de medida</option>
                    {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pb-6">
            <button type="button" onClick={() => navigate(-1)} style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 8, backgroundColor: "#fff" }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 700, color: "#fff", backgroundColor: COLORS.blue, borderRadius: 8 }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Crear Objetivo
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FieldSelect({
  label,
  value,
  error,
  onChange,
  options,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <div>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase" }}>
        {label} <span style={{ color: COLORS.orange }}>*</span>
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: `1.5px solid ${error ? COLORS.orange : "#E5E7EB"}`, borderRadius: 8, outline: "none", backgroundColor: "#fff" }}>
        <option value="">Selecciona</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{error}</p>}
    </div>
  );
}
