import { describe, expect, it } from "vitest";
import { passwordProblem } from "./AuthField";

describe("passwordProblem", () => {
  it("accepts a password within 10 characters and 72 bytes", () => {
    expect(passwordProblem("a".repeat(72), "a".repeat(72))).toBeNull();
  });

  it("counts bytes, so accented letters weigh double against the 72 limit", () => {
    const password = "ñ".repeat(37);

    expect(password.length).toBe(37);
    expect(passwordProblem(password, password)).toContain("cuentan como dos");
  });

  it("rejects short and mismatched passwords", () => {
    expect(passwordProblem("corta", "corta")).toContain("al menos 10");
    expect(passwordProblem("una-clave-larga", "otra-clave-larga")).toBe("Las contraseñas no coinciden.");
  });
});
