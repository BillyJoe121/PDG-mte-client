import { afterEach, describe, expect, it } from "vitest";
import type { UsuarioActual } from "../context/AuthContext";
import { placeTourCard } from "./tutorial/tourPlacement";
import { tourSteps, tourStepsFor } from "./tutorial/tourSteps";
import { hasCompletedTutorial, markTutorialCompleted, resetTutorialSessionState, tutorialStorageKey } from "./tutorial/tutorialStorage";

const user = (rol: UsuarioActual["rol"]): UsuarioActual => ({ id: "7", nombre: "Ana", correo: "ana@example.com", rol, iniciales: "AN" });

describe("tourStepsFor", () => {
  it("gives managers every step, from the welcome to the help button", () => {
    const steps = tourStepsFor(user("manager"));
    expect(steps.map((step) => step.id)).toEqual(tourSteps.map((step) => step.id));
    expect(steps[0].target).toBeUndefined();
    expect(steps.at(-1)?.target).toBe("help");
  });

  it("leaves out the screens and buttons the role cannot use", () => {
    const ids = tourStepsFor(user("visitor")).map((step) => step.id);
    expect(ids).toEqual([
      "welcome", "dashboard",
      "jerarquia", "jerarquia-cards", "jerarquia-manage", "jerarquia-table", "jerarquia-filter", "jerarquia-search", "jerarquia-kr", "jerarquia-initiative",
      "krs", "krs-manage", "proyectos", "proyectos-manage",
      "presentacion", "presentacion-modes", "presentacion-general", "presentacion-compare", "presentacion-slides", "presentacion-export",
      "help",
    ]);
  });

  it("points every screen step at an element on that screen", () => {
    for (const step of tourSteps.filter((item) => item.route)) {
      expect(step.target).toBeTruthy();
    }
  });
});

describe("placeTourCard", () => {
  const card = { width: 300, height: 160 };
  const viewport = { width: 1280, height: 800 };

  it("centers the card without a target", () => {
    expect(placeTourCard(null, card, viewport, false)).toEqual({ top: 320, left: 490, side: "center" });
  });

  it("puts menu steps to the right of the item", () => {
    const placed = placeTourCard({ top: 100, left: 0, width: 220, height: 40 }, card, viewport, true);
    expect(placed).toMatchObject({ side: "right", left: 240 });
  });

  it("puts side steps on the left when the right has no room", () => {
    expect(placeTourCard({ top: 200, left: 1000, width: 260, height: 300 }, card, viewport, true)).toMatchObject({ side: "left", left: 680 });
  });

  it("puts other steps below, or above when there is no room, inside the viewport", () => {
    expect(placeTourCard({ top: 60, left: 1200, width: 60, height: 36 }, card, viewport, false)).toEqual({ top: 116, left: 968, side: "bottom" });
    expect(placeTourCard({ top: 700, left: 400, width: 100, height: 36 }, card, viewport, false)).toMatchObject({ side: "top", top: 520 });
  });
});

describe("tutorialStorage", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetTutorialSessionState();
  });

  it("records completion per user", () => {
    expect(hasCompletedTutorial("7")).toBe(false);
    markTutorialCompleted("7");
    expect(window.localStorage.getItem(tutorialStorageKey("7"))).toBe("1");
    expect(hasCompletedTutorial("7")).toBe(true);
    expect(hasCompletedTutorial("8")).toBe(false);
  });
});
