import { afterEach, describe, expect, it, vi } from "vitest";
import { prefetchScreens, resetScreenPrefetchForTests } from "./routePrefetch";

const loadedScreens = vi.hoisted(() => [] as string[]);
vi.mock("./pages/Dashboard", () => (loadedScreens.push("Dashboard"), {}));
vi.mock("./pages/JerarquiaEstrategica", () => (loadedScreens.push("JerarquiaEstrategica"), {}));
vi.mock("./pages/Proyectos", () => (loadedScreens.push("Proyectos"), {}));
vi.mock("./pages/KRs", () => (loadedScreens.push("KRs"), {}));
vi.mock("./pages/Consistencia", () => (loadedScreens.push("Consistencia"), {}));

describe("prefetchScreens", () => {
  afterEach(() => {
    resetScreenPrefetchForTests();
    vi.useRealTimers();
  });

  it("loads every screen once the browser is idle, only once per page load", async () => {
    const loaders = [vi.fn(() => Promise.resolve()), vi.fn(() => Promise.reject(new Error("offline")))];
    let idle: (() => void) | undefined;
    const scheduleIdle = vi.fn((callback: () => void) => {
      idle = callback;
    });

    prefetchScreens({ loaders, scheduleIdle, saveData: false });
    prefetchScreens({ loaders, scheduleIdle, saveData: false });

    expect(scheduleIdle).toHaveBeenCalledTimes(1);
    expect(loaders[0]).not.toHaveBeenCalled();
    idle?.();
    await Promise.resolve();
    expect(loaders[0]).toHaveBeenCalledTimes(1);
    expect(loaders[1]).toHaveBeenCalledTimes(1);
  });

  it("skips prefetching when the person asked to save data", () => {
    const scheduleIdle = vi.fn();
    prefetchScreens({ loaders: [], scheduleIdle, saveData: true });
    expect(scheduleIdle).not.toHaveBeenCalled();
  });

  it("reads the data saver preference from the connection", () => {
    const scheduleIdle = vi.fn();
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
    try {
      prefetchScreens({ loaders: [], scheduleIdle });
      expect(scheduleIdle).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(navigator, "connection");
    }
  });

  it("uses requestIdleCallback when available", () => {
    const loader = vi.fn(() => Promise.resolve());
    const requestIdle = vi.spyOn(window, "requestIdleCallback").mockImplementation((callback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    });
    try {
      prefetchScreens({ loaders: [loader], saveData: false });
      expect(requestIdle).toHaveBeenCalledWith(expect.any(Function), { timeout: 4000 });
      expect(loader).toHaveBeenCalledTimes(1);
    } finally {
      requestIdle.mockRestore();
    }
  });

  it("falls back to a timer when requestIdleCallback is missing", () => {
    vi.useFakeTimers();
    const loader = vi.fn(() => Promise.resolve());
    const original = window.requestIdleCallback;
    Reflect.deleteProperty(window, "requestIdleCallback");
    try {
      prefetchScreens({ loaders: [loader], saveData: false });
      expect(loader).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1500);
      expect(loader).toHaveBeenCalledTimes(1);
    } finally {
      window.requestIdleCallback = original;
    }
  });

  it("prefetches the main sidebar screens by default", async () => {
    let idle: (() => void) | undefined;
    prefetchScreens({ scheduleIdle: (callback) => { idle = callback; }, saveData: false });
    idle?.();
    await vi.waitFor(() => expect(loadedScreens).toHaveLength(5));
    expect(loadedScreens).toEqual(expect.arrayContaining(["Dashboard", "JerarquiaEstrategica", "Proyectos", "KRs", "Consistencia"]));
  });
});
