import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Target, Trash2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  objectivesApi,
  type Department,
  type Goal,
  type KeyResultRequest,
  type StrategicBet,
} from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

interface CreateObjectiveModalProps {
  departments: Department[];
  goals: Goal[];
  periods: AcademicPeriod[];
  strategicBets: StrategicBet[];
  units: MeasurementUnit[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

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

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function CreateObjectiveModal({
  departments,
  goals,
  periods,
  strategicBets,
  units,
  onClose,
  onCreated,
}: CreateObjectiveModalProps) {
  const reduceMotion = useReducedMotion();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const activePeriods = useMemo(() => periods.filter((period) => period.status !== "CERRADO"), [periods]);
  const activeBets = useMemo(() => strategicBets.filter((bet) => bet.status !== "CERRADA"), [strategicBets]);
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
    setForm((prev) => ({
      ...prev,
      departmentId: prev.departmentId || String(departments[0]?.id ?? ""),
      academicPeriodId: prev.academicPeriodId || String(activePeriods[0]?.id ?? ""),
    }));
  }, [activePeriods, departments]);

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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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
      await onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el objetivo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={shortMotionTransition}
    >
      <motion.form
        onSubmit={submit}
        className="w-full max-w-3xl overflow-hidden rounded-lg bg-white"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={shortMotionTransition}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: COLORS.orange }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <Target size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 850, color: "rgba(255,255,255,0.76)", textTransform: "uppercase" }}>Objetivos y resultados clave</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>Nuevo Objetivo</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="Cerrar modal">
            <X size={18} color="#fff" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-5" style={{ backgroundColor: "#F8FAFC" }}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <ModalField label="Nombre" error={errors.name}>
                <input value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Ej: Mejorar permanencia estudiantil" style={modalInputStyle(Boolean(errors.name))} />
              </ModalField>
              <ModalField label="Departamento" error={errors.departmentId}>
                <ModalSelect
                  value={form.departmentId}
                  onChange={(value) => set("departmentId", value)}
                  error={Boolean(errors.departmentId)}
                  placeholder="Selecciona"
                  options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
                />
              </ModalField>
            </div>

            <ModalField label="Descripcion" error={errors.description}>
              <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} placeholder="Describe el resultado esperado y su alcance." style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
            </ModalField>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ModalField label="Periodo" error={errors.academicPeriodId}>
                <ModalSelect
                  value={form.academicPeriodId}
                  onChange={(value) => set("academicPeriodId", value)}
                  error={Boolean(errors.academicPeriodId)}
                  placeholder="Selecciona"
                  options={activePeriods.map((period) => ({ value: String(period.id), label: period.name }))}
                />
              </ModalField>
              <ModalField label="Meta" error={errors.goalId}>
                <ModalSelect
                  value={form.goalId}
                  onChange={(value) => set("goalId", value)}
                  error={Boolean(errors.goalId)}
                  placeholder="Selecciona"
                  options={goals.map((goal) => ({ value: String(goal.id), label: goal.name }))}
                />
              </ModalField>
              <ModalField label="Apuesta" error={errors.strategicBetId}>
                <ModalSelect
                  value={form.strategicBetId}
                  onChange={(value) => set("strategicBetId", value)}
                  error={Boolean(errors.strategicBetId)}
                  placeholder="Selecciona"
                  options={activeBets.map((bet) => ({ value: String(bet.id), label: bet.name }))}
                />
              </ModalField>
            </div>

            <div className="rounded-lg bg-white p-3" style={{ border: "1px solid #EEF2F7" }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase" }}>Key Results</span>
                  <span style={{ display: "block", marginTop: 2, fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>Define al menos uno para activar el objetivo.</span>
                </div>
                <button type="button" onClick={() => setKrs((prev) => [...prev, emptyKr()])} className="flex items-center gap-2 rounded-md" style={{ padding: "8px 11px", backgroundColor: COLORS.orange, color: "#fff", fontSize: "12px", fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.orange}33` }}>
                  <Plus size={14} /> KR
                </button>
              </div>

              <div className="space-y-2">
                {krs.map((kr, index) => (
                  <div key={index} className="rounded-md p-3" style={{ border: `1.5px solid ${errors[`kr-${index}`] ? COLORS.orange : "#D8DEE8"}`, backgroundColor: "#F8FAFC" }}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span style={{ fontSize: "10px", fontWeight: 900, color: COLORS.orange, textTransform: "uppercase" }}>KR {index + 1}</span>
                      {krs.length > 1 && (
                        <button type="button" onClick={() => setKrs((prev) => prev.filter((_, i) => i !== index))} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: "#fff", border: "1px solid #EEF2F7" }} title="Eliminar KR">
                          <Trash2 size={14} color={COLORS.orange} />
                        </button>
                      )}
                    </div>
                    {errors[`kr-${index}`] && <span style={{ display: "block", marginBottom: 6, fontSize: 11, color: COLORS.orange }}>{errors[`kr-${index}`]}</span>}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input value={kr.name} onChange={(event) => updateKr(index, "name", event.target.value)} placeholder="Nombre del KR" style={compactInputStyle} />
                      <input value={kr.metric} onChange={(event) => updateKr(index, "metric", event.target.value)} placeholder="Metrica" style={compactInputStyle} />
                    </div>
                    <textarea value={kr.description} onChange={(event) => updateKr(index, "description", event.target.value)} placeholder="Descripcion" rows={2} style={{ ...compactInputStyle, marginTop: 8, resize: "vertical" }} />
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[110px_120px_1fr]">
                      <input type="number" value={kr.baseValue} onChange={(event) => updateKr(index, "baseValue", event.target.value)} placeholder="Base" style={compactInputStyle} />
                      <input type="number" value={kr.targetValue} onChange={(event) => updateKr(index, "targetValue", event.target.value)} placeholder="Objetivo" style={compactInputStyle} />
                      <ModalSelect
                        value={kr.measurementUnitId}
                        onChange={(value) => updateKr(index, "measurementUnitId", value)}
                        error={false}
                        placeholder="Unidad"
                        options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ModalActions onClose={onClose} saving={saving} submitLabel="Crear Objetivo" />
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ModalField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div style={{ display: "block", padding: 10, borderRadius: 9, backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase", marginBottom: 7 }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: COLORS.orange }}>{error}</span>}
    </div>
  );
}

function ModalActions({ onClose, saving, submitLabel }: { onClose: () => void; saving: boolean; submitLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3">
      <button type="button" onClick={onClose} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 800, color: "#374151", border: "1px solid #D8DEE8", borderRadius: 8, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 20px", fontSize: 12, fontWeight: 850, color: "#fff", backgroundColor: COLORS.orange, borderRadius: 8, boxShadow: `0 10px 22px ${COLORS.orange}40` }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {submitLabel}
      </button>
    </div>
  );
}

function ModalSelect({
  value,
  onChange,
  disabled,
  error,
  placeholder,
  options,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error: boolean;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  compact?: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="focus-visible:ring-0" style={compact ? compactSelectStyle(error) : modalSelectStyle(error)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        {options.length === 0 ? (
          <SelectItem value="__empty" disabled className="rounded-md px-3 py-2 text-xs font-bold text-[#717182]">
            Sin opciones disponibles
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

function modalInputStyle(error: boolean): CSSProperties {
  return {
    width: "100%",
    minHeight: 38,
    padding: "8px 11px",
    fontSize: 12,
    border: `1.5px solid ${error ? COLORS.orange : "#D8DEE8"}`,
    borderRadius: 8,
    outline: "none",
    backgroundColor: "#F8FAFC",
    color: COLORS.text,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
  };
}

function modalSelectStyle(error: boolean): CSSProperties {
  return {
    ...modalInputStyle(error),
    appearance: "none",
    cursor: "pointer",
    fontWeight: 750,
    height: 38,
    padding: "8px 11px",
  };
}

function compactSelectStyle(error: boolean): CSSProperties {
  return {
    ...modalSelectStyle(error),
    minHeight: 36,
    height: 36,
    backgroundColor: "#fff",
  };
}

const compactInputStyle: CSSProperties = {
  width: "100%",
  minHeight: 36,
  padding: "8px 10px",
  fontSize: 12,
  border: "1.5px solid #D8DEE8",
  borderRadius: 8,
  outline: "none",
  backgroundColor: "#fff",
  color: COLORS.text,
};
