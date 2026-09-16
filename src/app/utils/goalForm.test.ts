import { describe, expect, it } from "vitest";
import type { MeasurementUnit } from "../services/catalogsApi";
import { getGoalValueInput, validateGoalForm, type GoalFormValues } from "./goalForm";

const percentage: MeasurementUnit = {
  id: 1,
  name: "Porcentaje",
  type: "PORCENTAJE",
  active: true,
};

const booleanUnit: MeasurementUnit = {
  id: 2,
  name: "Cumplimiento",
  type: "BOOLEANA",
  active: true,
};

const validForm: GoalFormValues = {
  name: "Permanencia estudiantil",
  description: "Elevar la permanencia de estudiantes.",
  referenceIndicator: "Tasa de permanencia",
  expectedValue: "90.25",
  measurementUnitId: "1",
  startDate: "2026-01-01",
  endDate: "2026-06-30",
};

describe("goal form rules", () => {
  it("requires the indicator that explains the expected value", () => {
    const errors = validateGoalForm(
      { ...validForm, referenceIndicator: "" },
      [percentage, booleanUnit],
    );

    expect(errors.referenceIndicator).toMatch(/indicador/i);
  });

  it("rejects percentages outside 0 to 100", () => {
    const errors = validateGoalForm(
      { ...validForm, expectedValue: "100.01" },
      [percentage, booleanUnit],
    );

    expect(errors.expectedValue).toMatch(/0 y 100/i);
  });

  it("only allows zero or one for boolean units", () => {
    const errors = validateGoalForm(
      { ...validForm, measurementUnitId: "2", expectedValue: "7" },
      [percentage, booleanUnit],
    );

    expect(errors.expectedValue).toMatch(/si o no/i);
  });

  it("describes a select for boolean units and a bounded number for percentages", () => {
    expect(getGoalValueInput(booleanUnit)).toEqual({ kind: "boolean" });
    expect(getGoalValueInput(percentage)).toEqual({ kind: "number", min: 0, max: 100, step: 0.01 });
  });

  it("accepts a complete valid goal", () => {
    expect(validateGoalForm(validForm, [percentage, booleanUnit])).toEqual({});
  });
});
