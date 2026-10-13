import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPeriods: vi.fn(), listUnits: vi.fn(), listDepartments: vi.fn(), loadDashboard: vi.fn(),
  tree: vi.fn(), listBets: vi.fn(), listGoals: vi.fn(), listKeyResults: vi.fn(),
  listProjects: vi.fn(), projectDetail: vi.fn(), contributionChain: vi.fn(),
  consolidated: vi.fn(), periodComparison: vi.fn(), consistencyCheck: vi.fn(), getPresentation: vi.fn(),
}));

vi.mock("./catalogsApi", () => ({
  academicPeriodsApi: { list: mocks.listPeriods },
  measurementUnitsApi: { list: mocks.listUnits },
}));
vi.mock("./consistencyApi", () => ({ consistencyApi: { check: mocks.consistencyCheck } }));
vi.mock("./dashboardApi", () => ({ dashboardApi: { load: mocks.loadDashboard } }));
vi.mock("./projectsApi", () => ({
  projectContributionApi: { contributionChain: mocks.contributionChain },
  projectsApi: { list: mocks.listProjects, detail: mocks.projectDetail },
}));
vi.mock("./reportsApi", () => ({
  presentationApi: { get: mocks.getPresentation },
  reportsApi: { consolidated: mocks.consolidated, periodComparison: mocks.periodComparison },
}));
vi.mock("./strategicApi", () => ({
  departmentsApi: { list: mocks.listDepartments }, goalsApi: { list: mocks.listGoals },
  hierarchyApi: { tree: mocks.tree }, keyResultsApi: { list: mocks.listKeyResults },
  strategicBetsApi: { list: mocks.listBets },
}));

import {
  getScreenDataCacheDiagnostics, invalidateScreenDataCache, loadAcademicPeriods, loadConsistencyCheck,
  loadDashboardScreen, loadDepartments, loadGoals, loadHierarchyScreen, loadMeasurementUnits,
  loadKeyResults, loadPresentationScreen, loadProjectDetailScreen, loadProjects,
  loadProjectsScreen, loadReportComparison, loadReportsScreen, loadStrategicBets,
} from "./screenDataCache";

describe("screen data cache", () => {
  beforeEach(() => {
    invalidateScreenDataCache();
    vi.clearAllMocks();
    mocks.listPeriods.mockResolvedValue([{ id: 1, name: "2026-1" }]);
    mocks.listUnits.mockResolvedValue([{ id: 1, name: "Porcentaje" }]);
    mocks.listDepartments.mockResolvedValue([{ id: 1, name: "DCSI" }]);
    mocks.loadDashboard.mockResolvedValue({ period: "2026-1" });
    mocks.tree.mockResolvedValue([{ id: 1 }]);
    mocks.listBets.mockResolvedValue([{ id: 1 }]);
    mocks.listGoals.mockResolvedValue([{ id: 2 }]);
    mocks.listKeyResults.mockResolvedValue([{ id: 3 }]);
    mocks.listProjects.mockResolvedValue([{ id: 4 }]);
    mocks.projectDetail.mockResolvedValue({ project: { id: 4 } });
    mocks.contributionChain.mockResolvedValue({ projectId: 4 });
    mocks.consolidated.mockResolvedValue({ rows: [] });
    mocks.periodComparison.mockResolvedValue({ periods: [] });
    mocks.consistencyCheck.mockResolvedValue({ summary: { total: 0 }, findings: [] });
    mocks.getPresentation.mockResolvedValue({ period: "2026-1", slides: [] });
  });

  it("reuses fresh values and in-flight requests, but force reloads", async () => {
    let release!: (value: unknown[]) => void;
    mocks.listPeriods.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const first = loadAcademicPeriods();
    const concurrent = loadAcademicPeriods();
    expect(concurrent).toBe(first);
    release([{ id: 1 }]);
    await first;
    await loadAcademicPeriods();
    expect(mocks.listPeriods).toHaveBeenCalledTimes(1);
    await loadAcademicPeriods({ force: true });
    expect(mocks.listPeriods).toHaveBeenCalledTimes(2);
  });

  it("expires old entries and removes failed loads so they can retry", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(100);
    await loadMeasurementUnits({ maxAgeMs: 10 });
    now.mockReturnValue(200);
    await loadMeasurementUnits({ maxAgeMs: 10 });
    expect(mocks.listUnits).toHaveBeenCalledTimes(2);
    mocks.listDepartments.mockRejectedValueOnce(new Error("offline"));
    await expect(loadDepartments()).rejects.toThrow("offline");
    await expect(loadDepartments()).resolves.toEqual([{ id: 1, name: "DCSI" }]);
    expect(mocks.listDepartments).toHaveBeenCalledTimes(2);
  });

  it("does not repopulate entries invalidated while a request is in flight", async () => {
    let release!: (value: unknown[]) => void;
    mocks.listGoals.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const pending = loadGoals("2026-1");
    invalidateScreenDataCache();
    release([{ id: 1 }]);
    await pending;
    await loadGoals("2026-1");
    expect(mocks.listGoals).toHaveBeenCalledTimes(2);
  });

  it("uses stable filter keys and distinguishes meaningful variants", async () => {
    await loadProjects({ search: "MTE", departmentId: 2 });
    await loadProjects({ departmentId: 2, search: "MTE" });
    await loadProjects({ search: "" });
    await loadProjects();
    await loadKeyResults({ strategicBetId: 1 });
    await loadKeyResults({ strategicBetId: 2 });
    await loadKeyResults({ strategicBetId: 2 });
    expect(mocks.listProjects).toHaveBeenCalledTimes(2);
    expect(mocks.listKeyResults).toHaveBeenCalledTimes(2);
    expect(mocks.listKeyResults).toHaveBeenCalledWith({ strategicBetId: 2 });
  });

  it("assembles dashboard, hierarchy and key result screen contracts", async () => {
    const dashboard = await loadDashboardScreen("2026-1");
    const hierarchy = await loadHierarchyScreen();
    const keyResults = await loadKeyResults({ periodId: 1 });
    expect(dashboard).toMatchObject({ periods: [{ id: 1 }], dashboard: { period: "2026-1" } });
    expect(hierarchy).toMatchObject({ tree: [{ id: 1 }], bets: [{ id: 1 }], goals: [{ id: 2 }] });
    expect(keyResults).toEqual([{ id: 3 }]);
  });

  it("keeps project detail usable when departments are unavailable", async () => {
    mocks.listDepartments.mockRejectedValue(new Error("catalog unavailable"));
    const detail = await loadProjectDetailScreen(4);
    expect(detail).toMatchObject({ detail: { project: { id: 4 } }, contributionChain: { projectId: 4 }, keyResults: [{ id: 3 }], departments: [] });
  });

  it("assembles projects, reports, comparisons and consistency data", async () => {
    const projects = await loadProjectsScreen({ period: "2026-1" });
    const reports = await loadReportsScreen({ period: "2026-1" });
    const comparison = await loadReportComparison({ basePeriod: "2026-1", comparePeriod: "2026-2" });
    const consistency = await loadConsistencyCheck({ staleDays: 15 });
    expect(projects).toMatchObject({ projects: [{ id: 4 }], keyResults: [{ id: 3 }] });
    expect(reports).toMatchObject({ report: { rows: [] } });
    expect(Object.keys(reports).sort()).toEqual(["departments", "periods", "report"]);
    expect(comparison).toEqual({ periods: [] });
    expect(consistency.summary.total).toBe(0);
  });

  it("loads presentation defaults and bounds filter variants", async () => {
    const result = await loadPresentationScreen();
    expect(result.presentation.period).toBe("2026-1");
    expect(mocks.getPresentation).toHaveBeenCalledWith({ period: undefined });
    await Promise.all(Array.from({ length: 120 }, (_, index) => loadPresentationScreen(`2026-${index}`)));
    const diagnostics = getScreenDataCacheDiagnostics();
    expect(diagnostics.entries).toBeLessThanOrEqual(diagnostics.maxEntries);
    expect(diagnostics.maxEntries).toBe(80);
  });

  it("loads direct catalog and strategy collections", async () => {
    await expect(loadStrategicBets("2026-1")).resolves.toEqual([{ id: 1 }]);
    await expect(loadGoals()).resolves.toEqual([{ id: 2 }]);
    await expect(loadMeasurementUnits()).resolves.toEqual([{ id: 1, name: "Porcentaje" }]);
  });
});
