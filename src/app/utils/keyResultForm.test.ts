import { describe, expect, it } from "vitest";
import type { MeasurementUnit } from "../services/catalogsApi";
import { getKeyResultValueInput, toKeyResultRequest, validateKeyResultForm, type KeyResultFormValues } from "./keyResultForm";

const percentage: MeasurementUnit = { id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true };
const booleanUnit: MeasurementUnit = { id: 2, name: "Cumplimiento", type: "BOOLEANA", active: true };
const inactiveUnit: MeasurementUnit = { id: 3, name: "Legada", type: "NUMERICA", active: false };

const validForm: KeyResultFormValues = {
  name: "Elevar permanencia",
  description: "Mide el avance de permanencia.",
  metric: "Tasa de permanencia",
  baseValue: "75",
  targetValue: "90",
  measurementUnitId: "1",
};

describe("key result form rules", () => {
  it("validates both percentage values", () => {
    expect(validateKeyResultForm({ ...validForm, baseValue: "-1" }, [percentage]).baseValue).toMatch(/0 y 100/i);
    expect(validateKeyResultForm({ ...validForm, targetValue: "101" }, [percentage]).targetValue).toMatch(/0 y 100/i);
  });

  it("only accepts zero or one for boolean values", () => {
    const errors = validateKeyResultForm(
      { ...validForm, measurementUnitId: "2", baseValue: "0", targetValue: "2" },
      [booleanUnit],
    );
    expect(errors.targetValue).toMatch(/si o no/i);
  });

  it("does not allow assigning an inactive unit", () => {
    const errors = validateKeyResultForm({ ...validForm, measurementUnitId: "3" }, [inactiveUnit]);
    expect(errors.measurementUnitId).toMatch(/inactiva/i);
  });

  it("returns a select configuration for boolean units", () => {
    expect(getKeyResultValueInput(booleanUnit)).toEqual({ kind: "boolean" });
    expect(getKeyResultValueInput(percentage)).toEqual({ kind: "number", min: 0, max: 100, step: 0.01 });
  });

  it("accepts a complete valid key result", () => {
    expect(validateKeyResultForm(validForm, [percentage])).toEqual({});
  });

  it("associates the objective period when serializing a nested key result", () => {
    expect(toKeyResultRequest(validForm, 7).academicPeriodId).toBe(7);
  });
});
