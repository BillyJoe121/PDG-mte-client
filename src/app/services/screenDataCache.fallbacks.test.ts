import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPeriods: vi.fn(), loadDashboard: vi.fn(), listBets: vi.fn(), listGoals: vi.fn(),
  consolidated: vi.fn(), getPresentation: vi.fn(),
}));

vi.mock("./catalogsApi", () => ({ academicPeriodsApi: { list: mocks.listPeriods }, measurementUnitsApi: { list: vi.fn() } }));
vi.mock("./consistencyApi", () => ({ consistencyApi: { check: vi.fn() } }));
vi.mock("./dashboardApi", () => ({ dashboardApi: { load: mocks.loadDashboard } }));
vi.mock("./projectsApi", () => ({ projectContributionApi: {}, projectsApi: {} }));
vi.mock("./reportsApi", () => ({
  presentationApi: { get: mocks.getPresentation },
  reportsApi: { consolidated: mocks.consolidated, periodComparison: vi.fn() },
}));
vi.mock("./strategicApi", () => ({
  departmentsApi: { list: vi.fn() }, goalsApi: { list: mocks.listGoals },
  hierarchyApi: { tree: vi.fn() }, keyResultsApi: { list: vi.fn() },
  strategicBetsApi: { list: mocks.listBets },
}));

import {
  invalidateScreenDataCache, loadAcademicPeriods, loadDashboardScreen, loadGoals, loadPresentationScreen,
} from "./screenDataCache";

describe("screen data cache fallbacks and expiry", () => {
  beforeEach(() => {
    invalidateScreenDataCache();
    vi.clearAllMocks();
    mocks.listPeriods.mockResolvedValue([{ id: 1 }]);
    mocks.loadDashboard.mockResolvedValue({ period: "active" });
    mocks.getPresentation.mockResolvedValue({ period: "2026-1", slides: [] });
    mocks.listBets.mockResolvedValue([{ id: 1 }]);
    mocks.listGoals.mockResolvedValue([{ id: 2 }]);
    mocks.consolidated.mockResolvedValue({ rows: [] });
  });

  afterEach(() => vi.useRealTimers());

  it("loads the dashboard of the active period when none is given", async () => {
    const result = await loadDashboardScreen();
    expect(result.dashboard).toEqual({ period: "active" });
    expect(mocks.loadDashboard).toHaveBeenCalledWith(undefined);
  });

  it("keeps the presentation when bets, goals and the consolidated report fail", async () => {
    mocks.listBets.mockRejectedValue(new Error("bets"));
    mocks.listGoals.mockRejectedValue(new Error("goals"));
    mocks.consolidated.mockRejectedValue(new Error("report"));

    const result = await loadPresentationScreen("2026-1");

    expect(result.bets).toEqual([]);
    expect(result.goals).toEqual([]);
    expect(result.consolidatedReport).toBeUndefined();
    expect(result.presentation.period).toBe("2026-1");
  });

  it("includes the consolidated report in the presentation when available", async () => {
    const result = await loadPresentationScreen("2026-1");
    expect(result.consolidatedReport).toEqual({ rows: [] });
  });

  it("serves a value until it expires and then reloads it", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await loadAcademicPeriods();
    vi.advanceTimersByTime(5 * 60 * 1000);
    await loadAcademicPeriods();
    expect(mocks.listPeriods).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await loadAcademicPeriods();
    expect(mocks.listPeriods).toHaveBeenCalledTimes(2);
  });

  it("does not drop a newer entry when a load invalidated mid-flight fails", async () => {
    let fail!: (error: Error) => void;
    mocks.listGoals.mockReturnValueOnce(new Promise((_resolve, reject) => { fail = reject; }));
    const pending = loadGoals("2026-1");
    invalidateScreenDataCache();
    await loadGoals("2026-1");
    fail(new Error("late"));
    await expect(pending).rejects.toThrow("late");

    await loadGoals("2026-1");
    expect(mocks.listGoals).toHaveBeenCalledTimes(2);
  });

  it("reloads a stale entry while keeping callers on the pending request", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await loadAcademicPeriods({ maxAgeMs: 10 });
    vi.advanceTimersByTime(100);
    let release!: (value: unknown[]) => void;
    mocks.listPeriods.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const first = loadAcademicPeriods({ maxAgeMs: 10 });
    const second = loadAcademicPeriods({ maxAgeMs: 10 });
    expect(second).toBe(first);
    release([{ id: 9 }]);
    await expect(first).resolves.toEqual([{ id: 9 }]);
  });
});
