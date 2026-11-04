import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DetailBody } from "../../components/DetailModal";
import { FORM_CONTROL_CLASS, FORM_LABEL_CLASS, FormActions, FormField, FormSelect, FormTopBar } from "../../components/forms/FormField";
import { PlannerUrlField } from "../../components/planner/PlannerUrlField";
import { useDirtyReport } from "../../hooks/useDiscardGuard";
import type { AcademicPeriod } from "../../services/catalogsApi";
import { normalizePlannerUrl, validatePlannerUrl } from "../../services/plannerService";
import type { Department } from "../../services/strategicApi";
import {
  projectsApi,
  validateProjectSchedule,
  type ProjectDetailResponse,
  type ProjectType,
  type ProjectUpdateRequest,
} from "../../services/projectsApi";
import { errorMessage } from "./projectDetailShared";
import { PROJECT_TYPE_OPTIONS, dateInputValue, parseTutors } from "./projectDetailUi";

/** Edit mode of the initiative detail: replaces its body and keeps its header. */
export function EditProjectPanel({
  departments,
  onCancel,
  onDirtyChange,
  onSaved,
  periods,
  project,
}: {
  departments: Department[];
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => Promise<void>;
  periods: AcademicPeriod[];
  project: ProjectDetailResponse["project"];
}) {
  const formId = useId();
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    type: project.type,
    departmentId: project.departmentId ? String(project.departmentId) : "",
    startPeriod: project.startPeriod,
    endPeriod: project.endPeriod ?? "",
    startDate: dateInputValue(project.startDate),
    endDate: dateInputValue(project.endDate),
    actualEndDate: dateInputValue(project.actualEndDate),
    tutors: project.tutors.join(", "),
    plannerUrl: project.plannerUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [plannerError, setPlannerError] = useState("");
  useDirtyReport(form, onDirtyChange);

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.departmentId || !form.startPeriod) {
      toast.error("Completa nombre, descripcion, departamento y periodo inicial.");
      return;
    }
    const scheduleError = validateProjectSchedule(form);
    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }

    const tutors = parseTutors(form.tutors);
    if (tutors.length === 0) {
      toast.error("Agrega al menos un tutor.");
      return;
    }

    const nextPlannerError = validatePlannerUrl(form.plannerUrl);
    setPlannerError(nextPlannerError ?? "");
    if (nextPlannerError) return;

    const payload: ProjectUpdateRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      departmentId: Number(form.departmentId),
      startPeriod: form.startPeriod,
      endPeriod: form.endPeriod || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      actualEndDate: form.actualEndDate || null,
      tutors,
      plannerUrl: normalizePlannerUrl(form.plannerUrl),
    };

    setSaving(true);
    try {
      await projectsApi.update(project.id, payload);
      toast.success("Iniciativa actualizada.");
      await onSaved();
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const periodOptions = periods.map((period) => ({ value: period.name, label: period.name }));

  return (
    <>
      <FormTopBar title="Editar iniciativa">
        <FormActions formId={formId} saving={saving} onCancel={onCancel} />
      </FormTopBar>
      <DetailBody>
        <form id={formId} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormField label="Nombre">
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} className={FORM_CONTROL_CLASS} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label="Descripción">
              <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} className={`${FORM_CONTROL_CLASS} resize-y`} />
            </FormField>
          </div>
          <FormField label="Tipo">
            <FormSelect label="Tipo" value={form.type} options={PROJECT_TYPE_OPTIONS} onChange={(value) => updateField("type", value as ProjectType)} />
          </FormField>
          <FormField label="Departamento">
            <FormSelect
              label="Departamento"
              value={form.departmentId}
              options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              onChange={(value) => updateField("departmentId", value)}
            />
          </FormField>
          <FormField label="Periodo inicial">
            <FormSelect label="Periodo inicial" value={form.startPeriod} options={periodOptions} onChange={(value) => updateField("startPeriod", value)} />
          </FormField>
          <FormField label="Periodo final">
            <FormSelect
              label="Periodo final"
              value={form.endPeriod || "none"}
              options={[{ value: "none", label: "Sin periodo final" }, ...periodOptions]}
              onChange={(value) => updateField("endPeriod", value === "none" ? "" : value)}
            />
          </FormField>
          <FormField label="Fecha inicio">
            <input type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} className={FORM_CONTROL_CLASS} />
          </FormField>
          <FormField label="Fecha fin">
            <input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} className={FORM_CONTROL_CLASS} />
          </FormField>
          <FormField label="Fecha fin real">
            <input type="date" min={form.startDate || undefined} value={form.actualEndDate} onChange={(event) => updateField("actualEndDate", event.target.value)} className={FORM_CONTROL_CLASS} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Tutores" hint="Separados por coma">
              <input value={form.tutors} onChange={(event) => updateField("tutors", event.target.value)} className={FORM_CONTROL_CLASS} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <PlannerUrlField
              id="edit-project-planner-url"
              value={form.plannerUrl}
              error={plannerError}
              onChange={(value) => {
                updateField("plannerUrl", value);
                setPlannerError("");
              }}
              inputClassName={FORM_CONTROL_CLASS}
              labelClassName={FORM_LABEL_CLASS}
              errorColor="#B42318"
            />
          </div>
        </form>
      </DetailBody>
    </>
  );
}
