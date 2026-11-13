import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Department, KeyResult } from "../../services/strategicApi";
import { toKeyResultOptions } from "../../utils/keyResultOptions";
import { normalizePlannerUrl, validatePlannerUrl } from "../../services/plannerService";
import { FORM_CONTROL_CLASS, FORM_LABEL_CLASS, FormActions, FormField, FormSelect, RequiredFieldsNote } from "../../components/forms/FormField";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/Modal";
import { PlannerUrlField } from "../../components/planner/PlannerUrlField";
import {
  projectsApi,
  validateProjectSchedule,
  type ContributionType,
  type ProjectKeyResultDraftRequest,
  type ProjectRequest,
  type ProjectStatus,
  type ProjectType,
} from "../../services/projectsApi";
import { parseTutors } from "../fichaProyecto/projectDetailUi";
import { CONTRIBUTION_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, errorMessage } from "./proyectosShared";
import { MODAL_HELP } from "../../components/modalHelpContent";

interface CreateProjectModalProps {
  departments: Department[];
  keyResults: KeyResult[];
  periods: AcademicPeriod[];
  onClose: () => void;
  onCreated: (projectId: number) => Promise<void> | void;
}

type Errors = Partial<Record<"name" | "description" | "departmentId" | "startPeriod" | "tutors" | "keyResults" | "plannerUrl", string>>;

export function CreateProjectModal({ departments, keyResults: availableKeyResults, periods, onClose, onCreated }: CreateProjectModalProps) {
  const formId = useId();
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
    plannerUrl: "",
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

  const keyResults = useMemo(() => toKeyResultOptions(availableKeyResults), [availableKeyResults]);

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
    const scheduleError = validateProjectSchedule(form);
    if (scheduleError) next.startPeriod = scheduleError;
    if (parseTutors(form.tutors).length === 0) next.tutors = "Ingresa al menos un tutor.";
    const plannerError = validatePlannerUrl(form.plannerUrl);
    if (plannerError) next.plannerUrl = plannerError;
    const invalidLink = krLinks.some((link) => !link.keyResultId || link.contributionWeight < 0 || link.contributionWeight > 100 || !link.contributionType);
    if (krLinks.length === 0) next.keyResults = "Selecciona al menos un Key Result.";
    else if (invalidLink) next.keyResults = "Cada vinculo KR debe tener peso entre 0 y 100 y tipo de contribucion.";
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
      plannerUrl: normalizePlannerUrl(form.plannerUrl),
    };

    try {
      const project = await projectsApi.create(payload);
      toast.success("Iniciativa creada correctamente.");
      await onCreated(project.id);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const periodOptions = periods.map((period) => ({ value: period.name, label: period.name }));

  return (
    <Modal size="lg" onClose={onClose}>
      <ModalHeader title="Nueva Iniciativa" onClose={onClose} help={MODAL_HELP.initiativeCreate} />
      <ModalBody>
        <form id={formId} onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><RequiredFieldsNote /></div>
          <div className="md:col-span-2">
            <FormField label="Nombre" required error={errors.name}>
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Iniciativa de analitica curricular" aria-invalid={Boolean(errors.name)} className={FORM_CONTROL_CLASS} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label="Descripción" required error={errors.description}>
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} placeholder="Describe alcance, propósito y entregables principales." aria-invalid={Boolean(errors.description)} className={`${FORM_CONTROL_CLASS} resize-y`} />
            </FormField>
          </div>
          <FormField label="Tipo">
            <FormSelect
              label="Tipo"
              value={form.type}
              options={TYPE_OPTIONS.filter((option) => option.value !== "todos").map((option) => ({ value: option.value, label: option.label }))}
              onChange={(value) => setField("type", value as ProjectType)}
            />
          </FormField>
          <FormField label="Departamento" required error={errors.departmentId}>
            <FormSelect
              label="Departamento"
              value={form.departmentId}
              invalid={Boolean(errors.departmentId)}
              options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              onChange={(value) => setField("departmentId", value)}
            />
          </FormField>
          <FormField label="Estado inicial">
            <FormSelect
              label="Estado inicial"
              value={form.status}
              options={STATUS_OPTIONS.filter((option) => option.value !== "todos").map((option) => ({ value: option.value, label: option.label }))}
              onChange={(value) => setField("status", value as ProjectStatus)}
            />
          </FormField>
          <FormField label="Tutores" required error={errors.tutors}>
            <input value={form.tutors} onChange={(event) => setField("tutors", event.target.value)} placeholder="Tutora A, Tutor B" aria-invalid={Boolean(errors.tutors)} className={FORM_CONTROL_CLASS} />
          </FormField>
          <FormField label="Periodo inicio" required error={errors.startPeriod}>
            <FormSelect label="Periodo inicio" value={form.startPeriod} invalid={Boolean(errors.startPeriod)} options={periodOptions} onChange={(value) => setField("startPeriod", value)} />
          </FormField>
          <FormField label="Periodo fin">
            <FormSelect
              label="Periodo fin"
              value={form.endPeriod || "__none"}
              options={[{ value: "__none", label: "Sin definir" }, ...periodOptions]}
              onChange={(value) => setField("endPeriod", value === "__none" ? "" : value)}
            />
          </FormField>
          <FormField label="Fecha inicio">
            <input type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} className={FORM_CONTROL_CLASS} />
          </FormField>
          <FormField label="Fecha fin">
            <input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} className={FORM_CONTROL_CLASS} />
          </FormField>
          <div className="md:col-span-2">
            <PlannerUrlField
              id="create-project-planner-url"
              value={form.plannerUrl}
              error={errors.plannerUrl}
              onChange={(value) => setField("plannerUrl", value)}
              inputClassName={FORM_CONTROL_CLASS}
              labelClassName={FORM_LABEL_CLASS}
              errorColor="#B42318"
            />
          </div>
          <div className="md:col-span-2">
            <FormField label="Key Results" required group hint={`${krLinks.length} seleccionado(s)`} error={errors.keyResults}>
              {keyResults.length === 0 ? (
                <p className="text-xs text-gray-500">No hay Key Results disponibles.</p>
              ) : (
                <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {keyResults.map((kr) => {
                    const link = krLinks.find((item) => item.keyResultId === kr.id);
                    const selected = Boolean(link);
                    return (
                      <div key={kr.id} className={`rounded-md border p-3 ${selected ? "border-[#5454E9] bg-gray-50" : "border-gray-200 bg-white"}`}>
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={selected}
                            aria-label={`Seleccionar KR ${kr.id}`}
                            onClick={() => toggleKeyResult(kr.id)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-[#5454E9] bg-[#5454E9] text-white" : "border-gray-300 bg-white"}`}
                          >
                            {selected && <Check size={12} aria-hidden="true" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#5454E9]">KR {kr.id} · {kr.strategyLabel}{kr.period ? ` · ${kr.period}` : ""}</p>
                            <p className="mt-0.5 text-sm font-bold text-[#111827]" style={{ overflowWrap: "anywhere" }}>{kr.name || kr.description}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{kr.metric}</p>
                          </div>
                          {selected && (
                            <button
                              type="button"
                              onClick={() => toggleKeyResult(kr.id)}
                              aria-label={`Quitar KR ${kr.id}`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                        {selected && link && (
                          <div className="ml-8 mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              aria-label={`Peso de contribución KR ${kr.id}`}
                              value={link.contributionWeight}
                              onChange={(event) => updateLink(kr.id, { contributionWeight: Math.max(0, Math.min(100, Number(event.target.value))) })}
                              className={FORM_CONTROL_CLASS}
                            />
                            <FormSelect
                              label={`Tipo de contribución KR ${kr.id}`}
                              value={link.contributionType}
                              options={CONTRIBUTION_OPTIONS}
                              onChange={(value) => updateLink(kr.id, { contributionType: value as ContributionType })}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </FormField>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <FormActions formId={formId} saving={saving} submitLabel="Crear Iniciativa" onCancel={onClose} />
      </ModalFooter>
    </Modal>
  );
}
