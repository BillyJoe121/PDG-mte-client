import type { MeasurementUnit } from "../services/catalogsApi";
import type { KeyResultRequest } from "../services/strategicApi";

export interface KeyResultFormValues {
  name: string;
  description: string;
  metric: string;
  baseValue: string;
  targetValue: string;
  measurementUnitId: string;
}

export type KeyResultFormErrors = Partial<Record<keyof KeyResultFormValues, string>>;

export type KeyResultValueInput =
  | { kind: "boolean" }
  | { kind: "number"; min?: number; max?: number; step: number };

export function getKeyResultValueInput(unit?: MeasurementUnit): KeyResultValueInput {
  if (unit?.type === "BOOLEANA") return { kind: "boolean" };
  if (unit?.type === "PORCENTAJE") return { kind: "number", min: 0, max: 100, step: 0.01 };
  return { kind: "number", step: 0.01 };
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
  return errors;
}

export function toKeyResultRequest(form: KeyResultFormValues, academicPeriodId?: number): KeyResultRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    metric: form.metric.trim(),
    baseValue: Number(form.baseValue),
    targetValue: Number(form.targetValue),
    measurementUnitId: Number(form.measurementUnitId),
    ...(academicPeriodId === undefined ? {} : { academicPeriodId }),
  };
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
