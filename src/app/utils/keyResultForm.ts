import type { MeasurementUnit } from "../services/catalogsApi";
import type { KeyResult, KeyResultRequest } from "../services/strategicApi";

export interface KeyResultFormValues {
  name: string;
  description: string;
  metric: string;
  baseValue: string;
  targetValue: string;
  measurementUnitId: string;
  academicPeriodId: string;
  goalIds: number[];
  strategicBetIds: number[];
}

export type KeyResultFormErrors = Partial<Record<keyof KeyResultFormValues | "links", string>>;

export const KEY_RESULT_LINKS_REQUIRED_MESSAGE = "Selecciona al menos una Meta o una Apuesta.";

export type KeyResultValueInput =
  | { kind: "boolean" }
  | { kind: "number"; min?: number; max?: number; step: number };

export function getKeyResultValueInput(unit?: MeasurementUnit): KeyResultValueInput {
  if (unit?.type === "BOOLEANA") return { kind: "boolean" };
  if (unit?.type === "PORCENTAJE") return { kind: "number", min: 0, max: 100, step: 0.01 };
  return { kind: "number", step: 0.01 };
}

export function initialKeyResultFormValues(
  keyResult: KeyResult | null,
  defaults: { goalIds?: number[]; strategicBetIds?: number[]; academicPeriodId?: number } = {},
): KeyResultFormValues {
  return {
    name: keyResult?.name ?? "",
    description: keyResult?.description ?? "",
    metric: keyResult?.metric ?? "",
    baseValue: String(keyResult?.baseValue ?? 0),
    targetValue: String(keyResult?.targetValue ?? ""),
    measurementUnitId: String(keyResult?.measurementUnitId ?? ""),
    academicPeriodId: String(keyResult?.academicPeriodId ?? defaults.academicPeriodId ?? ""),
    goalIds: keyResult ? (keyResult.goals ?? []).map((goal) => goal.id) : [...(defaults.goalIds ?? [])],
    strategicBetIds: keyResult
      ? (keyResult.strategicBets ?? []).map((bet) => bet.id)
      : [...(defaults.strategicBetIds ?? [])],
  };
}

export function validateKeyResultForm(
  form: KeyResultFormValues,
  units: MeasurementUnit[],
): KeyResultFormErrors {
  const errors: KeyResultFormErrors = {};
  const unit = units.find((item) => String(item.id) === form.measurementUnitId);

  if (!form.name.trim()) errors.name = "El nombre del KR es obligatorio.";
  if (!form.description.trim()) errors.description = "La descripcion del KR es obligatoria.";
  if (!form.metric.trim()) errors.metric = "La metrica es obligatoria.";
  if (!form.measurementUnitId || !unit) {
    errors.measurementUnitId = "Selecciona una unidad de medida.";
  } else if (!unit.active) {
    errors.measurementUnitId = "La unidad de medida seleccionada esta inactiva.";
  }

  validateValue(form.baseValue, "base", unit, "baseValue", errors);
  validateValue(form.targetValue, "objetivo", unit, "targetValue", errors);

  const periodId = Number(form.academicPeriodId);
  if (!form.academicPeriodId || !Number.isFinite(periodId) || periodId <= 0) {
    errors.academicPeriodId = "Selecciona un periodo academico.";
  }
  if (form.goalIds.length === 0 && form.strategicBetIds.length === 0) {
    errors.links = KEY_RESULT_LINKS_REQUIRED_MESSAGE;
  }
  return errors;
}

export function toKeyResultRequest(form: KeyResultFormValues): KeyResultRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    metric: form.metric.trim(),
    baseValue: Number(form.baseValue),
    targetValue: Number(form.targetValue),
    measurementUnitId: Number(form.measurementUnitId),
    academicPeriodId: Number(form.academicPeriodId),
    goalIds: [...new Set(form.goalIds)],
    strategicBetIds: [...new Set(form.strategicBetIds)],
  };
}

export function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function validateValue(
  value: string,
  label: string,
  unit: MeasurementUnit | undefined,
  field: "baseValue" | "targetValue",
  errors: KeyResultFormErrors,
) {
  const numericValue = Number(value);
  if (value === "" || !Number.isFinite(numericValue)) {
    errors[field] = `El valor ${label} es obligatorio y debe ser numerico.`;
  } else if (unit?.type === "PORCENTAJE" && (numericValue < 0 || numericValue > 100)) {
    errors[field] = `El valor ${label} debe estar entre 0 y 100.`;
  } else if (unit?.type === "BOOLEANA" && numericValue !== 0 && numericValue !== 1) {
    errors[field] = `Selecciona Si o No para el valor ${label}.`;
  }
}
