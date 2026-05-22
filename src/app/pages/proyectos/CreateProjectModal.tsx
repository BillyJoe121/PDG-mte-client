import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Check, FolderKanban, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Department, ObjectiveCard } from "../../services/strategicApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  projectsApi,
  type ContributionType,
  type ProjectKeyResultDraftRequest,
  type ProjectRequest,
  type ProjectStatus,
  type ProjectType,
} from "../../services/projectsApi";
import { COLORS, CONTRIBUTION_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, errorMessage } from "./proyectosShared";

interface CreateProjectModalProps {
  departments: Department[];
  objectiveCards: ObjectiveCard[];
  periods: AcademicPeriod[];
  onClose: () => void;
  onCreated: (projectId: number) => Promise<void> | void;
}

type Errors = Partial<Record<"name" | "description" | "departmentId" | "startPeriod" | "tutors" | "keyResults", string>>;

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function CreateProjectModal({ departments, objectiveCards, periods, onClose, onCreated }: CreateProjectModalProps) {
  const reduceMotion = useReducedMotion();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "GRADO" as ProjectType,
    departmentId: "",
    status: "BORRADOR" as ProjectStatus,
    startPeriod: "",
    endPeriod: "",
    startDate: "",
    endDate: "",
    tutors: "",
  });
  const [krLinks, setKrLinks] = useState<ProjectKeyResultDraftRequest[]>([]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      departmentId: current.departmentId || String(departments[0]?.id ?? ""),
      startPeriod: current.startPeriod || periods[0]?.name || "",
      endPeriod: current.endPeriod || periods[0]?.name || "",
    }));
  }, [departments, periods]);

  const keyResults = useMemo(() => objectiveCards.flatMap((objective) =>
    objective.keyResults.map((kr) => ({
      ...kr,
      objectiveName: objective.name,
      departmentName: objective.departmentName,
      period: objective.academicPeriodName,
    })),
  ), [objectiveCards]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const toggleKeyResult = (keyResultId: number) => {
    setKrLinks((current) => {
      if (current.some((link) => link.keyResultId === keyResultId)) {
        return current.filter((link) => link.keyResultId !== keyResultId);
      }
      return [...current, { keyResultId, contributionWeight: 30, contributionType: "DIRECTA" }];
    });
    setErrors((current) => ({ ...current, keyResults: "" }));
  };

  const updateLink = (keyResultId: number, changes: Partial<ProjectKeyResultDraftRequest>) => {
    setKrLinks((current) =>
      current.map((link) => link.keyResultId === keyResultId ? { ...link, ...changes } : link),
    );
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (!form.departmentId) next.departmentId = "Selecciona un departamento.";
    if (!form.startPeriod.trim()) next.startPeriod = "Selecciona el periodo de inicio.";
    if (parseTutors(form.tutors).length === 0) next.tutors = "Ingresa al menos un tutor.";
    const invalidLink = krLinks.some((link) => !link.keyResultId || link.contributionWeight < 0 || link.contributionWeight > 100 || !link.contributionType);
    if (invalidLink) next.keyResults = "Cada vinculo KR debe tener peso entre 0 y 100 y tipo de contribucion.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload: ProjectRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      departmentId: Number(form.departmentId),
      status: form.status,
      startPeriod: form.startPeriod,
      endPeriod: form.endPeriod || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      tutors: parseTutors(form.tutors),
      keyResultLinks: krLinks.length > 0 ? krLinks : undefined,
    };

    try {
      const project = await projectsApi.create(payload);
      toast.success("Proyecto creado correctamente.");
      await onCreated(project.id);
    } catch (error) {
      toast.error(errorMessage(error));
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
        className="w-full max-w-4xl overflow-hidden rounded-lg bg-white"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={shortMotionTransition}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <FolderKanban size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 850, color: "rgba(255,255,255,0.76)", textTransform: "uppercase" }}>Proyectos e iniciativas</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>Nuevo Proyecto</h2>
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
                <input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Proyecto de analitica curricular" style={modalInputStyle(Boolean(errors.name))} />
              </ModalField>
              <ModalField label="Departamento" error={errors.departmentId}>
                <ModalSelect value={form.departmentId} onChange={(value) => setField("departmentId", value)} error={Boolean(errors.departmentId)} placeholder="Selecciona" options={departments.map((department) => ({ value: String(department.id), label: department.name }))} />
              </ModalField>
            </div>

            <ModalField label="Descripcion" error={errors.description}>
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} placeholder="Describe alcance, objetivo y entregables principales." style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
            </ModalField>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ModalField label="Tipo">
                <ModalSelect value={form.type} onChange={(value) => setField("type", value as ProjectType)} error={false} placeholder="Tipo" options={TYPE_OPTIONS.filter((option) => option.value !== "todos").map((option) => ({ value: option.value, label: option.label }))} />
              </ModalField>
              <ModalField label="Estado inicial">
                <ModalSelect value={form.status} onChange={(value) => setField("status", value as ProjectStatus)} error={false} placeholder="Estado" options={STATUS_OPTIONS.filter((option) => option.value !== "todos").map((option) => ({ value: option.value, label: option.label }))} />
              </ModalField>
              <ModalField label="Tutores" error={errors.tutors}>
                <input value={form.tutors} onChange={(event) => setField("tutors", event.target.value)} placeholder="Tutora A, Tutor B" style={modalInputStyle(Boolean(errors.tutors))} />
              </ModalField>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <ModalField label="Periodo inicio" error={errors.startPeriod}>
                <ModalSelect value={form.startPeriod} onChange={(value) => setField("startPeriod", value)} error={Boolean(errors.startPeriod)} placeholder="Inicio" options={periods.map((period) => ({ value: period.name, label: period.name }))} />
              </ModalField>
              <ModalField label="Periodo fin">
                <ModalSelect value={form.endPeriod || "__none"} onChange={(value) => setField("endPeriod", value === "__none" ? "" : value)} error={false} placeholder="Fin" options={[{ value: "__none", label: "Sin definir" }, ...periods.map((period) => ({ value: period.name, label: period.name }))]} />
              </ModalField>
              <ModalField label="Fecha inicio">
                <input type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} style={dateInputStyle(false)} />
              </ModalField>
              <ModalField label="Fecha fin">
                <input type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} style={dateInputStyle(false)} />
              </ModalField>
            </div>

            <div className="rounded-lg bg-white p-3" style={{ border: "1px solid #EEF2F7" }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase" }}>Key Results opcionales</span>
                  <span style={{ display: "block", marginTop: 2, fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>{krLinks.length} seleccionado(s)</span>
                </div>
                <Plus size={15} color={COLORS.green} />
              </div>
              {errors.keyResults && <span style={{ display: "block", marginBottom: 6, fontSize: 11, color: COLORS.orange }}>{errors.keyResults}</span>}
              {keyResults.length === 0 ? (
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>No hay Key Results disponibles.</p>
              ) : (
                <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {keyResults.map((kr) => {
                    const link = krLinks.find((item) => item.keyResultId === kr.id);
                    const selected = Boolean(link);
                    return (
                      <div key={kr.id} className="rounded-md p-3" style={{ border: `1.5px solid ${selected ? COLORS.green : "#D8DEE8"}`, backgroundColor: selected ? "#ECFDF5" : "#F8FAFC" }}>
                        <div className="flex items-start gap-3">
                          <button type="button" onClick={() => toggleKeyResult(kr.id)} className="mt-0.5 flex h-5 w-5 items-center justify-center rounded" style={{ backgroundColor: selected ? COLORS.green : "#fff", border: `2px solid ${selected ? COLORS.green : "#D1D5DB"}` }}>
                            {selected && <Check size={12} color="#fff" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p style={{ fontSize: 10, fontWeight: 900, color: COLORS.green, textTransform: "uppercase" }}>KR {kr.id} · {kr.objectiveName} · {kr.period}</p>
                            <p style={{ fontSize: 12, fontWeight: 850, color: COLORS.text, marginTop: 3 }}>{kr.name || kr.description}</p>
                            <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>{kr.metric}</p>
                          </div>
                          {selected && (
                            <button type="button" onClick={() => toggleKeyResult(kr.id)} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: "#fff", border: "1px solid #D8DEE8" }}>
                              <Trash2 size={13} color={COLORS.orange} />
                            </button>
                          )}
                        </div>
                        {selected && link && (
                          <div className="ml-8 mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input type="number" min={0} max={100} value={link.contributionWeight} onChange={(event) => updateLink(kr.id, { contributionWeight: Math.max(0, Math.min(100, Number(event.target.value))) })} style={compactInputStyle} />
                            <ModalSelect compact value={link.contributionType} onChange={(value) => updateLink(kr.id, { contributionType: value as ContributionType })} error={false} placeholder="Tipo" options={CONTRIBUTION_OPTIONS} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <ModalActions onClose={onClose} saving={saving} />
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

function parseTutors(value: string) {
  return value.split(",").map((tutor) => tutor.trim()).filter(Boolean);
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

function ModalActions({ onClose, saving }: { onClose: () => void; saving: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3">
      <button type="button" onClick={onClose} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 800, color: "#374151", border: "1px solid #D8DEE8", borderRadius: 8, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 20px", fontSize: 12, fontWeight: 850, color: "#fff", backgroundColor: COLORS.green, borderRadius: 8, boxShadow: `0 10px 22px ${COLORS.green}40` }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Crear Proyecto
      </button>
    </div>
  );
}

function ModalSelect({ value, onChange, error, placeholder, options, compact = false }: { value: string; onChange: (value: string) => void; error: boolean; placeholder: string; options: Array<{ value: string; label: string }>; compact?: boolean }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={compact ? compactSelectStyle(error) : modalSelectStyle(error)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]" onClick={(event) => event.stopPropagation()}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {option.label}
          </SelectItem>
        ))}
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

function dateInputStyle(error: boolean): CSSProperties {
  return {
    ...modalInputStyle(error),
    padding: "10px 14px",
    fontSize: 13,
    border: `1.5px solid ${error ? COLORS.orange : "#E5E7EB"}`,
    backgroundColor: "#fff",
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
