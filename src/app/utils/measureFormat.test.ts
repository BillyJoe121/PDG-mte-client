import { describe, expect, it } from "vitest";
import { formatMeasure } from "./measureFormat";

describe("formatMeasure", () => {
  it("writes percentages with the sign", () => {
    expect(formatMeasure(88, "Porcentaje")).toBe("88%");
    expect(formatMeasure(85, "%")).toBe("85%");
    expect(formatMeasure(12.5, "por ciento")).toBe("12,5%");
  });

  it("leaves plain counts without a unit word", () => {
    expect(formatMeasure(24, "Numero")).toBe("24");
    expect(formatMeasure(24, "Número")).toBe("24");
    expect(formatMeasure(1500, "Cantidad")).toBe("1.500");
  });

  it("reads yes/no units as Sí or No", () => {
    expect(formatMeasure(1, "Si/No")).toBe("Sí");
    expect(formatMeasure(0, "Sí / No")).toBe("No");
  });

  it("articulates an index and keeps other units as a word after the number", () => {
    expect(formatMeasure(90, "Indice")).toBe("índice de 90");
    expect(formatMeasure(120, "Estudiantes")).toBe("120 estudiantes");
    expect(formatMeasure(3, "Dias")).toBe("3 días");
    expect(formatMeasure(2000000, "COP")).toBe("2.000.000 COP");
  });

  it("shows the value alone without a unit and nothing without a value", () => {
    expect(formatMeasure(7, null)).toBe("7");
    expect(formatMeasure(7, "  ")).toBe("7");
    expect(formatMeasure(null, "Porcentaje")).toBe("");
    expect(formatMeasure(undefined, "Numero")).toBe("");
  });
});
