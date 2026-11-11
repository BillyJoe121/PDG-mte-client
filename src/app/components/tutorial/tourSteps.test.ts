import { describe, expect, it } from "vitest";
import type { UsuarioActual } from "../../context/AuthContext";
import { tourSteps, tourStepsFor } from "./tourSteps";

const user = (rol: UsuarioActual["rol"]): UsuarioActual => ({ id: "1", nombre: "Ana", correo: "ana@example.com", rol, iniciales: "AN" });
const ids = (steps: { id: string }[]) => steps.map((step) => step.id);

describe("tourSteps", () => {
  it("has unique ids", () => {
    expect(new Set(ids(tourSteps)).size).toBe(tourSteps.length);
  });

  it("shows the tree of a goal or bet and the view toggle before the table", () => {
    const order = ids(tourSteps);
    const at = (id: string) => order.indexOf(id);
    expect(at("jerarquia-manage")).toBeLessThan(at("jerarquia-tree"));
    expect(at("jerarquia-tree-manage")).toBeLessThan(at("jerarquia-view-toggle"));
    expect(at("jerarquia-view-toggle")).toBe(at("jerarquia-table") - 1);
  });

  it("walks through a KR and an initiative after opening them", () => {
    const order = ids(tourSteps);
    expect(order.slice(order.indexOf("jerarquia-kr"), order.indexOf("jerarquia-initiative"))).toEqual([
      "jerarquia-kr", "kr-data", "kr-planner", "kr-progress", "kr-actions",
      "kr-form-data", "kr-form-period", "kr-form-goals", "kr-form-bets", "kr-form-planner",
    ]);
    expect(order).toEqual(expect.arrayContaining(["project-planner", "project-progress", "project-form-data", "project-form-dates", "project-form-planner", "project-link-kr", "krs-planner", "proyectos-planner"]));
  });

  it("keeps the card detail open across its steps", () => {
    const kept = tourSteps.filter((step) => step.keepShownTarget).map((step) => step.id);
    expect(kept).toEqual(["jerarquia-manage", "jerarquia-tree", "jerarquia-tree-manage", "jerarquia-tree-create"]);
  });

  it("closes the initiative progress form before the edit form and the following screens", () => {
    const clicksOf = (id: string) => tourSteps.find((step) => step.id === id)?.clicks ?? [];
    for (const id of ["project-form-data", "project-link-kr", "jerarquia-create", "krs"]) {
      expect(clicksOf(id)[0]).toBe("?project-progress-cancel");
    }
  });

  it("points the create step at both Nueva Meta and Nueva Apuesta", () => {
    expect(tourSteps.find((step) => step.id === "jerarquia-create")?.target).toBe("jerarquia-create");
  });

  it("explains each report tab and both exports", () => {
    expect(ids(tourSteps)).toEqual(expect.arrayContaining([
      "reportes-filters", "reportes-general", "reportes-departments", "reportes-ranking", "reportes-compare", "reportes-export-pdf", "reportes-export-csv",
    ]));
  });

  it("only shows editing steps to roles that can edit", () => {
    const visitor = ids(tourStepsFor(user("visitor")));
    expect(visitor).toContain("kr-data");
    expect(visitor).not.toContain("kr-form-data");
    expect(visitor).not.toContain("project-form-data");
    const admin = ids(tourStepsFor(user("admin")));
    expect(admin).toEqual(expect.arrayContaining(["kr-progress", "kr-form-goals", "project-progress", "project-link-kr", "jerarquia-tree-create"]));
  });
});
