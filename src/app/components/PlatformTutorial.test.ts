import { describe, expect, it } from "vitest";
import { platformTutorialSteps } from "./PlatformTutorial";

describe("platformTutorialSteps", () => {
  it("covers the full strategic traceability flow in a stable order", () => {
    expect(platformTutorialSteps.map((step) => step.title)).toEqual([
      "Bienvenido a MTE",
      "Navega por la estrategia",
      "Define objetivos medibles",
      "Conecta iniciativas con resultados",
      "Revisa y corrige",
      "Recorrido completado",
    ]);
  });

  it("offers destinations for the actionable parts of the tutorial", () => {
    expect(platformTutorialSteps.slice(0, -1).every((step) => Boolean(step.destination?.to))).toBe(true);
    expect(platformTutorialSteps.at(-1)?.destination).toBeUndefined();
  });
});
