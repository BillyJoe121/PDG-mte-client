import { type FormEvent, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { MeasurementUnit } from "../../services/catalogsApi";
import type { KeyResult, KeyResultRequest } from "../../services/strategicApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { COLORS } from "./okrsShared";

interface KrFormProps {
  initial: KeyResult | null;
  saving: boolean;
  units: MeasurementUnit[];
  onCancel: () => void;
  onSubmit: (body: KeyResultRequest) => Promise<void>;
}

export function KrForm({ units, initial, saving, onCancel, onSubmit }: KrFormProps) {
  const reduceMotion = useReducedMotion();
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
    <motion.form
      onSubmit={submit}
      className="rounded-md p-4 space-y-3"
      style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 10px 28px rgba(17,24,39,0.08)" }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <p style={{ fontSize: "11px", fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>{initial ? "Editar KR" : "Nuevo KR"}</p>
      {error && <p style={{ fontSize: "11px", color: COLORS.blue }}>{error}</p>}
      <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre" style={formControlStyle} />
      <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descripcion" rows={2} style={{ ...formControlStyle, resize: "vertical" }} />
      <input value={form.metric} onChange={(e) => setForm((prev) => ({ ...prev, metric: e.target.value }))} placeholder="Metrica" style={formControlStyle} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input type="number" value={form.baseValue} onChange={(e) => setForm((prev) => ({ ...prev, baseValue: e.target.value }))} placeholder="Base" style={formControlStyle} />
        <input type="number" value={form.targetValue} onChange={(e) => setForm((prev) => ({ ...prev, targetValue: e.target.value }))} placeholder="Objetivo" style={formControlStyle} />
        <Select value={form.measurementUnitId || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, measurementUnitId: value }))}>
          <SelectTrigger className="focus-visible:ring-0" style={formControlStyle}>
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent position="popper" align="start" className="z-[80] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
            {units.map((unit) => (
              <SelectItem key={unit.id} value={String(unit.id)} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} style={{ padding: "8px 13px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: "11px", fontWeight: 750, backgroundColor: "#fff", color: "#374151" }}>Cancelar</button>
        <button type="submit" disabled={saving} className="flex items-center gap-1 disabled:opacity-60" style={{ padding: "8px 13px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "11px", fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.blue}30` }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
        </button>
      </div>
    </motion.form>
  );
}

const formControlStyle = {
  width: "100%",
  minHeight: 38,
  padding: "8px 11px",
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: "12px",
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};
