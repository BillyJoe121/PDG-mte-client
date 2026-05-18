import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Edit2, KeyRound, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { measurementUnitsApi, type MeasurementUnit } from "../services/catalogsApi";
import { ApiError, keyResultsApi, objectivesApi, type KeyResult, type KeyResultRequest, type Objective } from "../services/strategicApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
};

export function GestionKRs() {
  const { okrId } = useParams<{ okrId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const canEdit = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const objectiveId = Number(okrId);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<KeyResult | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!objectiveId) return;
    setLoading(true);
    try {
      const [nextObjective, unitList] = await Promise.all([
        objectivesApi.get(objectiveId),
        measurementUnitsApi.list(),
      ]);
      setObjective(nextObjective);
      setUnits(unitList.filter((unit) => unit.active));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el objetivo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [objectiveId]);

  const remove = async (kr: KeyResult) => {
    if (!window.confirm(`Eliminar el Key Result "${kr.name}"?`)) return;
    setSaving(true);
    try {
      await keyResultsApi.remove(kr.id);
      toast.success("Key Result eliminado");
      await load();
    } catch (error) {
      const message = error instanceof ApiError && error.status === 409
        ? "No se puede eliminar este Key Result porque tiene proyectos vinculados activos."
        : error instanceof Error ? error.message : "No se pudo eliminar el Key Result";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando Key Results...
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
        <AlertTriangle size={40} color={COLORS.orange} />
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#000" }}>Objetivo no encontrado</p>
        <button onClick={() => navigate("/okrs")} className="flex items-center gap-2" style={{ padding: "10px 20px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 700 }}>
          <ArrowLeft size={14} /> Volver a Objetivos
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F9FAFB", minHeight: "100%" }}>
      <div className="sticky top-0 z-10 bg-white px-6 py-3" style={{ borderBottom: "2px solid #000" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/okrs")} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50" style={{ border: "1px solid #E5E7EB", fontSize: "12px", fontWeight: 700, color: "#374151" }}>
            <ArrowLeft size={14} /> Objetivos
          </button>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: "10px", color: COLORS.gray, fontWeight: 800, textTransform: "uppercase" }}>Objetivo #{objective.id}</p>
            <h1 style={{ fontSize: "15px", fontWeight: 900, color: "#000" }}>{objective.name}</h1>
          </div>
          {canEdit && !adding && !editing && (
            <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 800 }}>
              <Plus size={14} /> Nuevo KR
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl p-5" style={{ border: "1.5px solid #E5E7EB" }}>
          <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{objective.description}</p>
          <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 8 }}>
            {objective.departmentName} · {objective.academicPeriodName} · {objective.strategicBetName} · {objective.goalName}
          </p>
        </div>

        {adding && (
          <KrForm
            units={units}
            initial={null}
            saving={saving}
            onCancel={() => setAdding(false)}
            onSubmit={async (body) => {
              setSaving(true);
              try {
                await objectivesApi.addKeyResult(objective.id, body);
                toast.success("Key Result agregado");
                setAdding(false);
                await load();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "No se pudo agregar el Key Result");
              } finally {
                setSaving(false);
              }
            }}
          />
        )}

        {objective.keyResults.map((kr) => (
          <div key={kr.id} className="bg-white rounded-xl p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            {editing?.id === kr.id ? (
              <KrForm
                units={units}
                initial={kr}
                saving={saving}
                onCancel={() => setEditing(null)}
                onSubmit={async (body) => {
                  setSaving(true);
                  try {
                    await keyResultsApi.update(kr.id, body);
                    toast.success("Key Result actualizado");
                    setEditing(null);
                    await load();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "No se pudo actualizar el Key Result");
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            ) : (
              <div className="flex items-start gap-3">
                <KeyRound size={16} color={COLORS.blue} className="mt-1" />
                <div className="flex-1">
                  <p style={{ fontSize: "13px", fontWeight: 900, color: "#000" }}>{kr.name}</p>
                  <p style={{ fontSize: "12px", color: "#374151", marginTop: 3 }}>{kr.description}</p>
                  <p style={{ fontSize: "10px", color: COLORS.gray, marginTop: 6 }}>
                    {kr.metric} · Base {kr.baseValue} · Actual {kr.currentValue} · Objetivo {kr.targetValue} {kr.measurementUnitName} · {kr.progressPercentage}%
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(kr)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 size={14} color={COLORS.blue} /></button>
                    <button onClick={() => void remove(kr)} className="p-1.5 rounded hover:bg-red-50"><Trash2 size={14} color={COLORS.orange} /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {objective.keyResults.length === 0 && !adding && (
          <div className="text-center py-12 rounded-xl" style={{ border: "2px dashed #E5E7EB", backgroundColor: "#fff" }}>
            <KeyRound size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: "13px", color: COLORS.gray }}>Este objetivo no tiene Key Results.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KrForm({ units, initial, saving, onCancel, onSubmit }: { units: MeasurementUnit[]; initial: KeyResult | null; saving: boolean; onCancel: () => void; onSubmit: (body: KeyResultRequest) => Promise<void> }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    metric: initial?.metric ?? "",
    baseValue: String(initial?.baseValue ?? 0),
    targetValue: String(initial?.targetValue ?? ""),
    measurementUnitId: String(initial?.measurementUnitId ?? ""),
  });
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.metric.trim() || !form.targetValue || !form.measurementUnitId) {
      setError("Completa nombre, descripcion, metrica, valor objetivo y unidad.");
      return;
    }
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      metric: form.metric.trim(),
      baseValue: Number(form.baseValue) || 0,
      targetValue: Number(form.targetValue),
      measurementUnitId: Number(form.measurementUnitId),
    });
  };

  return (
    <form onSubmit={submit} className="rounded-lg p-4 space-y-3" style={{ border: `2px solid ${COLORS.blue}`, backgroundColor: "#F0F4FF" }}>
      <div className="flex items-center justify-between">
        <p style={{ fontSize: "11px", fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>{initial ? "Editar KR" : "Nuevo KR"}</p>
        <button type="button" onClick={onCancel}><X size={16} /></button>
      </div>
      {error && <p style={{ fontSize: "11px", color: COLORS.orange }}>{error}</p>}
      <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre" style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px" }} />
      <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descripcion" rows={2} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", resize: "vertical" }} />
      <input value={form.metric} onChange={(e) => setForm((prev) => ({ ...prev, metric: e.target.value }))} placeholder="Metrica" style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px" }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input type="number" value={form.baseValue} onChange={(e) => setForm((prev) => ({ ...prev, baseValue: e.target.value }))} placeholder="Base" style={{ padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px" }} />
        <input type="number" value={form.targetValue} onChange={(e) => setForm((prev) => ({ ...prev, targetValue: e.target.value }))} placeholder="Objetivo" style={{ padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px" }} />
        <select value={form.measurementUnitId} onChange={(e) => setForm((prev) => ({ ...prev, measurementUnitId: e.target.value }))} style={{ padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", backgroundColor: "#fff" }}>
          <option value="">Unidad</option>
          {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} style={{ padding: "7px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "11px", fontWeight: 700 }}>Cancelar</button>
        <button type="submit" disabled={saving} className="flex items-center gap-1 disabled:opacity-60" style={{ padding: "7px 12px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 6, fontSize: "11px", fontWeight: 800 }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
        </button>
      </div>
    </form>
  );
}
