import { type FormEvent, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { MeasurementUnit } from "../../services/catalogsApi";
import type { KeyResult, KeyResultRequest } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

interface KrFormProps {
  initial: KeyResult | null;
  saving: boolean;
  units: MeasurementUnit[];
  onCancel: () => void;
  onSubmit: (body: KeyResultRequest) => Promise<void>;
}

export function KrForm({ units, initial, saving, onCancel, onSubmit }: KrFormProps) {
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
      <p style={{ fontSize: "11px", fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>{initial ? "Editar KR" : "Nuevo KR"}</p>
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
