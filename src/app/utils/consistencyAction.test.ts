import { describe, expect, it } from "vitest";
import { resolveConsistencyActionTarget } from "./consistencyAction";

describe("resolveConsistencyActionTarget", () => {
  it("keeps current application routes for corrective actions", () => {
    expect(resolveConsistencyActionTarget("/krs?objectiveId=8&keyResultId=15")).toBe("/krs?objectiveId=8&keyResultId=15");
    expect(resolveConsistencyActionTarget("/proyectos?projectId=22")).toBe("/proyectos?projectId=22");
  });

  it("normalizes legacy API routes instead of sending the user to a missing page", () => {
    expect(resolveConsistencyActionTarget("/objectives/8/key-results/15")).toBe("/krs?objectiveId=8&keyResultId=15");
    expect(resolveConsistencyActionTarget("/projects/22")).toBe("/proyectos?projectId=22");
  });

  it("rejects an action URL that cannot open a supported resource", () => {
    expect(resolveConsistencyActionTarget("https://untrusted.example/redirect")).toBeNull();
    expect(resolveConsistencyActionTarget("/krs?keyResultId=15")).toBeNull();
  });
});
