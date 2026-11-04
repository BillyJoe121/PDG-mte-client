import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { ApiError, updateKeyResultProgress, type KeyResult } from "../../services/strategicApi";
import { DETAIL_PRIMARY_BUTTON_CLASS } from "../../components/DetailModal";

interface KeyResultProgressFormProps {
  keyResult: KeyResult;
  onRecorded: (updated: KeyResult) => Promise<void> | void;
}

interface ProgressFieldErrors {
  currentValue?: string;
  progressPercentage?: string;
}

export interface ProgressDraft {
  currentValue: string;
  progressPercentage: string;
}

/** Validates the two manually recorded values. Returns field messages, empty when valid. */
export function validateProgressDraft(draft: ProgressDraft): ProgressFieldErrors {
  const errors: ProgressFieldErrors = {};
  const currentText = draft.currentValue.trim();
  const progressText = draft.progressPercentage.trim();

  if (!currentText) {
    errors.currentValue = "Ingresa el valor actual medido para este KR.";
  } else if (!Number.isFinite(Number(currentText))) {
    errors.currentValue = "El valor actual debe ser un número.";
  }

  if (!progressText) {
    errors.progressPercentage = "Ingresa el avance que registras, de 0 a 100.";
  } else {
    const progress = Number(progressText);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      errors.progressPercentage = "El avance debe estar entre 0 y 100 %.";
    }
  }
  return errors;
}

function describeApiError(error: unknown) {
  if (error instanceof ApiError) {
    const genericMessage = /^Error \d+$/.test(error.message);
    if (genericMessage && (error.status === 409 || error.status === 400)) {
      return "El KR no admite este registro de avance. Si está cerrado, ya no se puede modificar.";
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "No se pudo registrar el avance del KR. Intenta de nuevo.";
}

export function KeyResultProgressForm({ keyResult, onRecorded }: KeyResultProgressFormProps) {
  const [draft, setDraft] = useState<ProgressDraft>({ currentValue: "", progressPercentage: "" });
  const [fieldErrors, setFieldErrors] = useState<ProgressFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentId = `kr-current-value-${keyResult.id}`;
  const progressId = `kr-progress-${keyResult.id}`;

  const updateField = (field: keyof ProgressDraft, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setSubmitError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const errors = validateProgressDraft(draft);
    setFieldErrors(errors);
    if (errors.currentValue || errors.progressPercentage) return;

    setSaving(true);
    setSubmitError(null);
    try {
      const updated = await updateKeyResultProgress(keyResult.id, {
        currentValue: Number(draft.currentValue.trim()),
        progressPercentage: Number(draft.progressPercentage.trim()),
      });
      setDraft({ currentValue: "", progressPercentage: "" });
      await onRecorded(updated);
    } catch (error) {
      setSubmitError(describeApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `mt-1 h-[38px] w-full rounded-md border bg-white px-2.5 text-sm text-[#111827] ${hasError ? "border-[#B42318]" : "border-gray-300"}`;
  const labelClass = "text-[9px] font-extrabold uppercase tracking-wide text-gray-500";
  const errorClass = "mt-1 text-xs font-bold text-[#B42318]";

  return (
    <form className="mt-3 space-y-3 border-t border-gray-100 pt-3" noValidate onSubmit={(event) => void submit(event)} aria-label="Registrar avance del KR">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={currentId} className={labelClass}>Valor actual ({keyResult.measurementUnitName})</label>
          <input
            id={currentId}
            type="number"
            step="any"
            required
            value={draft.currentValue}
            onChange={(event) => updateField("currentValue", event.target.value)}
            placeholder={`Valor medido en ${keyResult.measurementUnitName}`}
            aria-invalid={Boolean(fieldErrors.currentValue)}
            aria-describedby={fieldErrors.currentValue ? `${currentId}-error` : undefined}
            className={inputClass(Boolean(fieldErrors.currentValue))}
          />
          {fieldErrors.currentValue && <p id={`${currentId}-error`} className={errorClass}>{fieldErrors.currentValue}</p>}
        </div>
        <div className="min-w-0">
          <label htmlFor={progressId} className={labelClass}>Avance registrado (%)</label>
          <input
            id={progressId}
            type="number"
            step="any"
            min={0}
            max={100}
            required
            value={draft.progressPercentage}
            onChange={(event) => updateField("progressPercentage", event.target.value)}
            placeholder="De 0 a 100"
            aria-invalid={Boolean(fieldErrors.progressPercentage)}
            aria-describedby={fieldErrors.progressPercentage ? `${progressId}-error` : undefined}
            className={inputClass(Boolean(fieldErrors.progressPercentage))}
          />
          {fieldErrors.progressPercentage && <p id={`${progressId}-error`} className={errorClass}>{fieldErrors.progressPercentage}</p>}
        </div>
      </div>
      {submitError && <p role="alert" className={errorClass}>{submitError}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={DETAIL_PRIMARY_BUTTON_CLASS}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Registrando..." : "Registrar avance"}
        </button>
      </div>
    </form>
  );
}
