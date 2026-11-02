import { describe, expect, it } from "vitest";
import { ACTION_OPTIONS, ENTITY_OPTIONS, labelAction, labelEntity } from "./auditLabels";

describe("audit labels", () => {
  it("labels the account actions emitted by the API", () => {
    expect(labelAction("ACCOUNT_LOCKED")).toBe("Cuenta bloqueada");
    expect(labelAction("ACCESS_LINK_CREATED")).toBe("Enlace de acceso generado");
    expect(labelAction("PASSWORD_CHANGED")).toBe("Contraseña cambiada");
    expect(labelAction("PASSWORD_SET")).toBe("Contraseña establecida");
  });

  it("offers every action and entity type as a filter option", () => {
    expect(ACTION_OPTIONS).toHaveLength(12);
    expect(ENTITY_OPTIONS.map((option) => option.value)).toEqual(expect.arrayContaining([
      "ACADEMIC_PERIOD", "DEPARTMENT", "DIRECTORY_USER", "GOAL", "KEY_RESULT", "MEASUREMENT_UNIT", "POSITION",
      "PROFESSOR", "PROJECT", "PROJECT_KEY_RESULT_LINK", "PROJECT_SYNC", "PROJECT_TEACHER", "ROLE", "SCHOOL",
      "STRATEGIC_BET", "TEACHER_POSITION", "WORLD",
    ]));
    expect(ENTITY_OPTIONS).toHaveLength(17);
  });

  it("falls back to the raw value for unknown actions and entity types", () => {
    expect(labelAction("FUTURE_ACTION")).toBe("FUTURE_ACTION");
    expect(labelEntity("FUTURE_ENTITY")).toBe("FUTURE_ENTITY");
    expect(labelEntity("toString")).toBe("toString");
  });
});
