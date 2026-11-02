import { describe, expect, it } from "vitest";

describe("CI deploy gate", () => {
  it("fails on purpose to check a red run does not reach staging", () => {
    expect("red").toBe("green");
  });
});
