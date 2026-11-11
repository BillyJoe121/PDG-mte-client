import { describe, expect, it } from "vitest";
import { formatValueWithUnit } from "./okrsShared";

describe("formatValueWithUnit", () => {
  it("writes the value with its unit in natural Spanish", () => {
    expect(formatValueWithUnit(90, "Porcentaje")).toBe("90%");
    expect(formatValueWithUnit(24, "Numero")).toBe("24");
  });

  it("shows the value alone when the unit is missing and never prints undefined", () => {
    expect(formatValueWithUnit(90, null)).toBe("90");
    expect(formatValueWithUnit(0, undefined)).toBe("0");
    expect(formatValueWithUnit(null, null)).toBe("");
  });
});
