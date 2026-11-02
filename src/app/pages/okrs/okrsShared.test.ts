import { describe, expect, it } from "vitest";
import { formatValueWithUnit } from "./okrsShared";

describe("formatValueWithUnit", () => {
  it("joins the value and the unit name", () => {
    expect(formatValueWithUnit(90, "Porcentaje")).toBe("90 Porcentaje");
  });

  it("shows the value alone when the unit is missing and never prints undefined", () => {
    expect(formatValueWithUnit(90, null)).toBe("90");
    expect(formatValueWithUnit(0, undefined)).toBe("0");
    expect(formatValueWithUnit(null, null)).toBe("");
  });
});
