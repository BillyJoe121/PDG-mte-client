import { type FormEvent, useState } from "react";
import { BookOpen, Flag, Loader2, Save } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import type { KeyResult, KeyResultRequest } from "../../services/strategicApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { KeyResultValueField } from "../../components/forms/KeyResultValueField";
import {
  initialKeyResultFormValues,
  toKeyResultRequest,
  toggleId,
  validateKeyResultForm,
  type KeyResultFormErrors,
  type KeyResultFormValues,
} from "../../utils/keyResultForm";
import { COLORS } from "./okrsShared";
import { KrLinkChecklist, type KrLinkOption } from "./KrLinkChecklist";

interface KrFormProps {
  initial: KeyResult | null;
  saving: boolean;
  units: MeasurementUnit[];
  periods: AcademicPeriod[];
  goals: KrLinkOption[];
  strategicBets: KrLinkOption[];
  defaults?: { goalIds?: number[]; strategicBetIds?: number[]; academicPeriodId?: number };
  onCancel: () => void;
  onSubmit: (body: KeyResultRequest) => Promise<void>;
}

export function KrForm({ units, periods, goals, strategicBets, defaults, initial, saving, onCancel, onSubmit }: KrFormProps) {
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState<KeyResultFormValues>(() => initialKeyResultFormValues(initial, defaults));
  const [errors, setErrors] = useState<KeyResultFormErrors>({});
  const { links: linksError, ...fieldErrors } = errors;
  const error = Object.values(fieldErrors)[0] ?? "";
  const linksErrorId = "kr-form-links-error";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateKeyResultForm(form, units);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(toKeyResultRequest(form));
  };

  const selectedUnit = units.find((unit) => String(unit.id) === form.measurementUnitId);

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
      {error && <p role="alert" style={{ fontSize: "11px", color: COLORS.blue }}>{error}</p>}
      <input aria-label="Nombre" aria-invalid={Boolean(errors.name)} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre" style={formControlStyle} />
      <textarea aria-label="Descripcion" aria-invalid={Boolean(errors.description)} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descripcion" rows={2} style={{ ...formControlStyle, resize: "vertical" }} />
      <input aria-label="Metrica" aria-invalid={Boolean(errors.metric)} value={form.metric} onChange={(e) => setForm((prev) => ({ ...prev, metric: e.target.value }))} placeholder="Metrica" style={formControlStyle} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KeyResultValueField label="Valor base" value={form.baseValue} unit={selectedUnit} onChange={(value) => setForm((prev) => ({ ...prev, baseValue: value }))} style={formControlStyle} />
        <KeyResultValueField label="Valor objetivo" value={form.targetValue} unit={selectedUnit} onChange={(value) => setForm((prev) => ({ ...prev, targetValue: value }))} style={formControlStyle} />
        <Select value={form.measurementUnitId || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, measurementUnitId: value }))}>
          <SelectTrigger aria-label="Unidad de medida" aria-invalid={Boolean(errors.measurementUnitId)} className="focus-visible:ring-0" style={formControlStyle}>
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
      <Select value={form.academicPeriodId || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, academicPeriodId: value }))}>
        <SelectTrigger aria-label="Periodo academico" aria-invalid={Boolean(errors.academicPeriodId)} className="focus-visible:ring-0" style={formControlStyle}>
          <SelectValue placeholder="Periodo academico" />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="z-[80] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
          {periods.map((period) => (
            <SelectItem key={period.id} value={String(period.id)} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
              {period.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid grid-cols-1 gap-3">
        <KrLinkChecklist
          id="kr-form-goals"
          legend="Metas"
          icon={<BookOpen size={13} color={COLORS.green} />}
          options={goals}
          selectedIds={form.goalIds}
          invalid={Boolean(linksError)}
          describedBy={linksError ? linksErrorId : undefined}
          emptyText="No hay metas disponibles."
          onToggle={(id) => setForm((prev) => ({ ...prev, goalIds: toggleId(prev.goalIds, id) }))}
        />
        <KrLinkChecklist
          id="kr-form-bets"
          legend="Apuestas"
          icon={<Flag size={13} color={COLORS.blue} />}
          options={strategicBets}
          selectedIds={form.strategicBetIds}
          invalid={Boolean(linksError)}
          describedBy={linksError ? linksErrorId : undefined}
          emptyText="No hay apuestas disponibles."
          onToggle={(id) => setForm((prev) => ({ ...prev, strategicBetIds: toggleId(prev.strategicBetIds, id) }))}
        />
        {linksError && <p id={linksErrorId} role="alert" style={{ fontSize: "11px", color: COLORS.orange, fontWeight: 800 }}>{linksError}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="detail-invert-button detail-invert-button--outline detail-invert-button--blue" style={{ padding: "8px 13px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: "11px", fontWeight: 750, backgroundColor: "#fff", color: "#374151" }}>Cancelar</button>
        <button type="submit" disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--blue flex items-center gap-1 disabled:opacity-60" style={{ padding: "8px 13px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "11px", fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.blue}30` }}>
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
