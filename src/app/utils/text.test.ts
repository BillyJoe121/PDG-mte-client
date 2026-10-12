import { describe, expect, it } from "vitest";
import { truncateText } from "./text";

describe("truncateText", () => {
  it("preserves text at or below the limit", () => {
    expect(truncateText("MTE", 3)).toBe("MTE");
    expect(truncateText("", 0)).toBe("");
  });

  it("truncates values that exceed the limit", () => {
    expect(truncateText("Trazabilidad", 5)).toBe("Traza...");
  });
});
