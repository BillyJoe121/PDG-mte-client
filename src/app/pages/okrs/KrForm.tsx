import { type FormEvent, useState } from "react";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import type { KeyResult, KeyResultRequest } from "../../services/strategicApi";
import {
  FORM_CONTROL_CLASS,
  FORM_LABEL_CLASS,
  FormActions,
  FormError,
  FormField,
  FormSelect,
} from "../../components/forms/FormField";
import { KeyResultValueField } from "../../components/forms/KeyResultValueField";
import { PlannerUrlField } from "../../components/planner/PlannerUrlField";
import { useDirtyReport } from "../../hooks/useDiscardGuard";
import {
  initialKeyResultFormValues,
  toKeyResultRequest,
  toggleId,
  validateKeyResultForm,
  type KeyResultFormErrors,
  type KeyResultFormValues,
} from "../../utils/keyResultForm";
import { KrLinkChecklist, type KrLinkOption } from "./KrLinkChecklist";

interface KrFormProps {
  initial: KeyResult | null;
  saving: boolean;
  units: MeasurementUnit[];
  periods: AcademicPeriod[];
  goals: KrLinkOption[];
  strategicBets: KrLinkOption[];
  defaults?: { goalIds?: number[]; strategicBetIds?: number[]; academicPeriodId?: number };
  /** Set with `hideActions` when the buttons live in the modal header or footer. */
  formId?: string;
  hideActions?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onCancel: () => void;
  onSubmit: (body: KeyResultRequest) => Promise<void>;
}

export function KrForm({ units, periods, goals, strategicBets, defaults, initial, saving, formId, hideActions = false, onDirtyChange, onCancel, onSubmit }: KrFormProps) {
  const [form, setForm] = useState<KeyResultFormValues>(() => initialKeyResultFormValues(initial, defaults));
  const [errors, setErrors] = useState<KeyResultFormErrors>({});
  const { links: linksError, plannerUrl: plannerError, ...fieldErrors } = errors;
  const error = Object.values(fieldErrors)[0] ?? "";
  const linksErrorId = "kr-form-links-error";
  useDirtyReport(form, onDirtyChange);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateKeyResultForm(form, units);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(toKeyResultRequest(form));
  };

  const selectedUnit = units.find((unit) => String(unit.id) === form.measurementUnitId);

  return (
    <form id={formId} onSubmit={submit} className="space-y-4">
      {error && <FormError>{error}</FormError>}
      <FormField label="Nombre">
        <input aria-label="Nombre" aria-invalid={Boolean(errors.name)} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={FORM_CONTROL_CLASS} />
      </FormField>
      <FormField label="Descripción">
        <textarea aria-label="Descripción" aria-invalid={Boolean(errors.description)} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className={`${FORM_CONTROL_CLASS} resize-y`} />
      </FormField>
      <FormField label="Métrica">
        <input aria-label="Métrica" aria-invalid={Boolean(errors.metric)} value={form.metric} onChange={(e) => setForm((prev) => ({ ...prev, metric: e.target.value }))} className={FORM_CONTROL_CLASS} />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Valor base">
          <KeyResultValueField label="Valor base" value={form.baseValue} unit={selectedUnit} onChange={(value) => setForm((prev) => ({ ...prev, baseValue: value }))} className={FORM_CONTROL_CLASS} />
        </FormField>
        <FormField label="Valor meta">
          <KeyResultValueField label="Valor meta" value={form.targetValue} unit={selectedUnit} onChange={(value) => setForm((prev) => ({ ...prev, targetValue: value }))} className={FORM_CONTROL_CLASS} />
        </FormField>
        <FormField label="Unidad de medida">
          <FormSelect
            label="Unidad de medida"
            value={form.measurementUnitId}
            invalid={Boolean(errors.measurementUnitId)}
            options={units.map((unit) => ({ value: String(unit.id), label: unit.active ? unit.name : `${unit.name} (inactiva)` }))}
            onChange={(value) => setForm((prev) => ({ ...prev, measurementUnitId: value }))}
          />
        </FormField>
      </div>
      <FormField label="Periodo académico">
        <FormSelect
          label="Periodo académico"
          value={form.academicPeriodId}
          invalid={Boolean(errors.academicPeriodId)}
          options={periods.map((period) => ({ value: String(period.id), label: period.name }))}
          onChange={(value) => setForm((prev) => ({ ...prev, academicPeriodId: value }))}
        />
      </FormField>
      <PlannerUrlField
        id="kr-form-planner-url"
        value={form.plannerUrl}
        error={plannerError}
        onChange={(value) => setForm((prev) => ({ ...prev, plannerUrl: value }))}
        inputClassName={FORM_CONTROL_CLASS}
        labelClassName={FORM_LABEL_CLASS}
        errorColor="#B42318"
      />
      <div className="space-y-3">
        <KrLinkChecklist
          id="kr-form-goals"
          legend="Metas"
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
          options={strategicBets}
          selectedIds={form.strategicBetIds}
          invalid={Boolean(linksError)}
          describedBy={linksError ? linksErrorId : undefined}
          emptyText="No hay apuestas disponibles."
          onToggle={(id) => setForm((prev) => ({ ...prev, strategicBetIds: toggleId(prev.strategicBetIds, id) }))}
        />
        {linksError && <FormError id={linksErrorId}>{linksError}</FormError>}
      </div>
      {!hideActions && (
        <div className="flex justify-end gap-2">
          <FormActions saving={saving} onCancel={onCancel} />
        </div>
      )}
    </form>
  );
}
