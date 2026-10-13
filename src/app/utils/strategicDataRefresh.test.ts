import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { intersectsStrategicScopes, listenStrategicDataChanges, signalStrategicDataChanged } from "./strategicDataRefresh";

describe("strategic data refresh events", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("persists and dispatches a same-tab change", () => {
    const listener = vi.fn();
    const stop = listenStrategicDataChanges(listener);

    signalStrategicDataChanged({ reason: "project updated", projectId: 7, scopes: ["projects", "dashboard"] });

    expect(listener).toHaveBeenCalledWith({
      reason: "project updated",
      projectId: 7,
      scopes: ["projects", "dashboard"],
      changedAt: Date.now(),
    });
    expect(JSON.parse(localStorage.getItem("mte_strategic_data_changed") ?? "{}")).toMatchObject({ projectId: 7 });

    stop();
    signalStrategicDataChanged({ reason: "ignored", scopes: ["reports"] });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("still dispatches when local storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    const listener = vi.fn();
    listenStrategicDataChanges(listener);

    expect(() => signalStrategicDataChanged({ reason: "private mode", scopes: ["hierarchy"] })).not.toThrow();
    expect(listener).toHaveBeenCalledOnce();
  });

  it("accepts valid cross-tab storage changes and ignores unrelated or malformed values", () => {
    const listener = vi.fn();
    listenStrategicDataChanges(listener);
    const detail = { reason: "remote", scopes: ["keyResults"], changedAt: 10 };

    window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: JSON.stringify(detail) }));
    window.dispatchEvent(new StorageEvent("storage", { key: "mte_strategic_data_changed", newValue: null }));
    window.dispatchEvent(new StorageEvent("storage", { key: "mte_strategic_data_changed", newValue: "{" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "mte_strategic_data_changed", newValue: JSON.stringify(detail) }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(detail);
  });

  it("compares scopes by intersection", () => {
    expect(intersectsStrategicScopes(["projects", "reports"], ["reports"])).toBe(true);
    expect(intersectsStrategicScopes(["projects"], ["dashboard"])).toBe(false);
  });
});
