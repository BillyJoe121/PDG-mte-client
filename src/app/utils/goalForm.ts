import type { MeasurementUnit } from "../services/catalogsApi";

export interface GoalFormValues {
  name: string;
  description: string;
  referenceIndicator: string;
  expectedValue: string;
  measurementUnitId: string;
  startDate: string;
  endDate: string;
}

export type GoalFormErrors = Partial<Record<keyof GoalFormValues, string>>;

export type GoalValueInput =
  | { kind: "boolean" }
  | { kind: "number"; min: number; max?: number; step: number };

export function getGoalValueInput(unit?: MeasurementUnit): GoalValueInput {
  if (unit?.type === "BOOLEANA") return { kind: "boolean" };
  if (unit?.type === "PORCENTAJE") return { kind: "number", min: 0, max: 100, step: 0.01 };
  return { kind: "number", min: 0, step: 0.01 };
}

export function validateGoalForm(form: GoalFormValues, units: MeasurementUnit[]): GoalFormErrors {
  const errors: GoalFormErrors = {};
  const unit = units.find((item) => String(item.id) === form.measurementUnitId);
  const numericValue = Number(form.expectedValue);

  if (!form.name.trim()) errors.name = "El nombre es obligatorio.";
  if (!form.description.trim()) errors.description = "La descripcion es obligatoria.";
  if (!form.referenceIndicator.trim()) errors.referenceIndicator = "El indicador de referencia es obligatorio.";
  if (!form.measurementUnitId || !unit) errors.measurementUnitId = "La unidad de medida es obligatoria.";

  if (form.expectedValue === "" || !Number.isFinite(numericValue)) {
    errors.expectedValue = "El valor esperado es obligatorio y debe ser numerico.";
  } else if (numericValue < 0) {
    errors.expectedValue = "El valor esperado debe ser mayor o igual a cero.";
  } else if (unit?.type === "PORCENTAJE" && numericValue > 100) {
    errors.expectedValue = "El porcentaje debe estar entre 0 y 100.";
  } else if (unit?.type === "BOOLEANA" && numericValue !== 0 && numericValue !== 1) {
    errors.expectedValue = "Selecciona Si o No para una unidad booleana.";
  }

  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    errors.endDate = "La fecha de cierre debe ser posterior al inicio.";
  }

  return errors;
}
