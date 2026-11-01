import { useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { ApiError, updateKeyResultProgress, type KeyResult } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

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

  const inputStyle = (hasError: boolean) => ({
    border: `1px solid ${hasError ? COLORS.orange : COLORS.border}`,
    color: COLORS.text,
  });
  const labelStyle = { color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" as const };
  const errorStyle = { color: "#B42318", fontSize: 11, fontWeight: 700, marginTop: 4 };

  return (
    <form className="mt-3 space-y-2" noValidate onSubmit={(event) => void submit(event)} aria-label="Registrar avance del KR">
      <div>
        <label htmlFor={currentId} style={labelStyle}>Valor actual ({keyResult.measurementUnitName})</label>
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
          className="mt-1 w-full rounded-md px-3 py-2 text-sm"
          style={inputStyle(Boolean(fieldErrors.currentValue))}
        />
        {fieldErrors.currentValue && <p id={`${currentId}-error`} style={errorStyle}>{fieldErrors.currentValue}</p>}
      </div>
      <div>
        <label htmlFor={progressId} style={labelStyle}>Avance registrado (%)</label>
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
          className="mt-1 w-full rounded-md px-3 py-2 text-sm"
          style={inputStyle(Boolean(fieldErrors.progressPercentage))}
        />
        {fieldErrors.progressPercentage && <p id={`${progressId}-error`} style={errorStyle}>{fieldErrors.progressPercentage}</p>}
      </div>
      {submitError && <p role="alert" style={{ ...errorStyle, marginTop: 0 }}>{submitError}</p>}
      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#5454E9] px-3 py-2 text-sm font-black text-white disabled:opacity-60">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saving ? "Registrando..." : "Registrar avance"}
      </button>
    </form>
  );
}
