import { describe, expect, it } from "vitest";
import { getContextualHelp } from "./ContextualHelp";

describe("getContextualHelp", () => {
  it("returns project guidance for both listing and detail routes", () => {
    expect(getContextualHelp("/proyectos").title).toBe("Proyectos e iniciativas");
    expect(getContextualHelp("/proyectos/nuevo").steps).toContain("Abre la ficha para actualizar fechas, responsables, estado y vínculos con KRs.");
  });

  it("groups objective and Key Result routes under the OKR guidance", () => {
    expect(getContextualHelp("/okrs/nuevo").title).toBe("Objetivos y Key Results");
    expect(getContextualHelp("/krs?objectiveId=4").title).toBe("Objetivos y Key Results");
  });

  it("keeps a safe general guide for an unknown route", () => {
    expect(getContextualHelp("/ruta-no-existente").title).toBe("Módulo MTE");
  });
});
