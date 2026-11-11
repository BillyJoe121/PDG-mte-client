import { describe, expect, it } from "vitest";
import { computeStageFit, STAGE_HEIGHT, STAGE_WIDTH } from "./presentationStage";

describe("computeStageFit", () => {
  it("keeps a 1920×1080 screen at its natural size", () => {
    expect(computeStageFit(1920, 1080)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });

  it("letterboxes a taller area with bands above and below", () => {
    const fit = computeStageFit(1280, 1024);
    expect(fit.scale).toBeCloseTo(1280 / STAGE_WIDTH);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBeCloseTo((1024 - STAGE_HEIGHT * fit.scale) / 2);
  });

  it("pillarboxes a wider area with bands on the sides", () => {
    const fit = computeStageFit(2560, 1080);
    expect(fit.scale).toBe(1);
    expect(fit.offsetX).toBe(320);
    expect(fit.offsetY).toBe(0);
  });

  it("grows the slide on a 4K projector", () => {
    expect(computeStageFit(3840, 2160).scale).toBe(2);
  });

  it("shrinks the slide on a phone without overflowing", () => {
    const fit = computeStageFit(390, 700);
    expect(STAGE_WIDTH * fit.scale).toBeLessThanOrEqual(390);
    expect(STAGE_HEIGHT * fit.scale).toBeLessThanOrEqual(700);
  });

  it.each([
    [0, 0],
    [-10, 500],
    [Number.NaN, 400],
    [800, Number.POSITIVE_INFINITY],
  ])("falls back to scale 1 for an unmeasured area (%s × %s)", (width, height) => {
    expect(computeStageFit(width, height)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });
});
