import { describe, expect, it } from "vitest";
import { resolveConsistencyActionTarget, resolveConsistencyDetail } from "./consistencyAction";

describe("resolveConsistencyActionTarget", () => {
  it("keeps current application routes for corrective actions", () => {
    expect(resolveConsistencyActionTarget("/krs?keyResultId=15")).toBe("/krs?keyResultId=15");
    expect(resolveConsistencyActionTarget("/proyectos?projectId=22")).toBe("/proyectos?projectId=22");
  });

  it("normalizes legacy project API routes instead of sending the user to a missing page", () => {
    expect(resolveConsistencyActionTarget("/projects/22")).toBe("/proyectos?projectId=22");
  });

  it("rejects an action URL that cannot open a supported resource", () => {
    expect(resolveConsistencyActionTarget("https://untrusted.example/redirect")).toBeNull();
    expect(resolveConsistencyActionTarget("/krs?keyResultId=abc")).toBeNull();
    expect(resolveConsistencyActionTarget("/krs")).toBeNull();
  });
});

describe("resolveConsistencyDetail", () => {
  it("names the KR or initiative a finding opens", () => {
    expect(resolveConsistencyDetail("/krs?keyResultId=15")).toEqual({ kind: "kr", id: 15 });
    expect(resolveConsistencyDetail("/proyectos?projectId=22")).toEqual({ kind: "project", id: 22 });
    expect(resolveConsistencyDetail("/projects/7")).toEqual({ kind: "project", id: 7 });
  });

  it("opens nothing for an invalid destination", () => {
    expect(resolveConsistencyDetail("https://untrusted.example/redirect")).toBeNull();
    expect(resolveConsistencyDetail("/proyectos?projectId=0")).toBeNull();
  });
});
