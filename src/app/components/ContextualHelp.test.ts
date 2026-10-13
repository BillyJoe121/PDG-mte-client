import { describe, expect, it } from "vitest";
import { getContextualHelp } from "./ContextualHelp";

describe("getContextualHelp", () => {
  it("returns initiative guidance for both listing and detail routes", () => {
    expect(getContextualHelp("/proyectos").title).toBe("Iniciativas");
    expect(getContextualHelp("/proyectos/nuevo").steps).toContain("Abre la ficha para actualizar fechas, responsables, estado y vínculos con KRs.");
  });

  it("describes Key Results linked directly to Metas and Apuestas", () => {
    const help = getContextualHelp("/krs?keyResultId=4");
    expect(help.title).toBe("Key Results");
    expect(help.steps.join(" ")).toContain("al menos una Meta o una Apuesta");
  });

  it("keeps a safe general guide for an unknown route", () => {
    expect(getContextualHelp("/ruta-no-existente").title).toBe("Módulo MTE");
  });
});
