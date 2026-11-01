import { describe, expect, it } from "vitest";
import { getLabelRol } from "./roleLabels";

describe("getLabelRol", () => {
  it("returns the Spanish label for each role", () => {
    expect(getLabelRol("admin")).toBe("Administrador");
    expect(getLabelRol("manager")).toBe("Gestor estratégico");
    expect(getLabelRol("contributor")).toBe("Colaborador");
  });

  it("returns undefined for an unknown role", () => {
    expect(getLabelRol("visitante" as never)).toBeUndefined();
  });
});
