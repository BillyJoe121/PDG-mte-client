import { describe, expect, it } from "vitest";
import type { MeasurementUnit } from "../services/catalogsApi";
import type { KeyResult } from "../services/strategicApi";
import {
  KEY_RESULT_LINKS_REQUIRED_MESSAGE,
  getKeyResultValueInput,
  initialKeyResultFormValues,
  toKeyResultRequest,
  toggleId,
  validateKeyResultForm,
  type KeyResultFormValues,
} from "./keyResultForm";

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
  academicPeriodId: "7",
  goalIds: [3],
  strategicBetIds: [],
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

  it("accepts a complete valid key result linked to a Meta or an Apuesta", () => {
    expect(validateKeyResultForm(validForm, [percentage])).toEqual({});
    expect(validateKeyResultForm({ ...validForm, goalIds: [], strategicBetIds: [5] }, [percentage])).toEqual({});
  });

  it("requires at least one Meta or Apuesta", () => {
    const errors = validateKeyResultForm({ ...validForm, goalIds: [], strategicBetIds: [] }, [percentage]);
    expect(errors.links).toBe("Selecciona al menos una Meta o una Apuesta.");
    expect(KEY_RESULT_LINKS_REQUIRED_MESSAGE).toBe("Selecciona al menos una Meta o una Apuesta.");
  });

  it("requires an academic period", () => {
    expect(validateKeyResultForm({ ...validForm, academicPeriodId: "" }, [percentage]).academicPeriodId).toMatch(/periodo/i);
    expect(validateKeyResultForm({ ...validForm, academicPeriodId: "0" }, [percentage]).academicPeriodId).toMatch(/periodo/i);
  });

  it("validates required and numeric fields without a selected unit", () => {
    const errors = validateKeyResultForm({
      ...validForm, name: "", description: " ", metric: "", baseValue: "", targetValue: "not-a-number", measurementUnitId: "",
    }, [percentage]);
    expect(errors).toMatchObject({
      name: expect.any(String), description: expect.any(String), metric: expect.any(String),
      measurementUnitId: expect.any(String), baseValue: expect.any(String), targetValue: expect.any(String),
    });
    expect(getKeyResultValueInput()).toEqual({ kind: "number", step: 0.01 });
  });

  it("serializes trimmed values with period and deduplicated Metas and Apuestas", () => {
    const request = toKeyResultRequest({
      ...validForm, name: "  KR  ", description: " Desc ", metric: " Metric ", goalIds: [3, 3, 4], strategicBetIds: [9],
    });
    expect(request).toEqual({
      name: "KR",
      description: "Desc",
      metric: "Metric",
      baseValue: 75,
      targetValue: 90,
      measurementUnitId: 1,
      academicPeriodId: 7,
      goalIds: [3, 4],
      strategicBetIds: [9],
    });
  });

  it("builds initial values from an existing key result or from defaults", () => {
    const keyResult = {
      id: 1, name: "KR", description: "D", metric: "M", baseValue: 1, targetValue: 2, currentValue: 0,
      progressPercentage: 0, measurementUnitId: 1, measurementUnitName: "Porcentaje", academicPeriodId: 4,
      goals: [{ id: 3, name: "Meta" }], strategicBets: [{ id: 8, name: "Apuesta" }], status: "ACTIVO", createdAt: "",
    } satisfies KeyResult;
    expect(initialKeyResultFormValues(keyResult)).toMatchObject({ academicPeriodId: "4", goalIds: [3], strategicBetIds: [8] });
    expect(initialKeyResultFormValues(null, { strategicBetIds: [6] })).toMatchObject({ goalIds: [], strategicBetIds: [6], academicPeriodId: "" });
  });

  it("toggles selected ids", () => {
    expect(toggleId([1, 2], 2)).toEqual([1]);
    expect(toggleId([1], 3)).toEqual([1, 3]);
  });
});
