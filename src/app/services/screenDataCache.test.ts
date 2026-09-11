import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPeriods: vi.fn(),
  getPresentation: vi.fn(),
  listGoals: vi.fn(),
  listObjectiveCards: vi.fn(),
}));

vi.mock("./catalogsApi", () => ({
  academicPeriodsApi: { list: mocks.listPeriods },
  measurementUnitsApi: { list: vi.fn() },
}));
vi.mock("./consistencyApi", () => ({ consistencyApi: { check: vi.fn() } }));
vi.mock("./dashboardApi", () => ({ dashboardApi: { load: vi.fn() } }));
vi.mock("./projectsApi", () => ({
  projectContributionApi: { contributionChain: vi.fn() },
  projectsApi: { list: vi.fn(), detail: vi.fn() },
}));
vi.mock("./reportsApi", () => ({
  presentationApi: { get: mocks.getPresentation },
  reportsApi: { consolidated: vi.fn(), periodComparison: vi.fn() },
}));
vi.mock("./strategicApi", () => ({
  departmentsApi: { list: vi.fn() },
  goalsApi: { list: mocks.listGoals },
  hierarchyApi: { tree: vi.fn() },
  objectivesApi: { cards: mocks.listObjectiveCards },
  strategicBetsApi: { list: vi.fn() },
}));

import { invalidateScreenDataCache, loadPresentationScreen } from "./screenDataCache";

describe("presentation screen data", () => {
  beforeEach(() => {
    invalidateScreenDataCache();
    vi.clearAllMocks();
    mocks.listPeriods.mockResolvedValue([
      { id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" },
    ]);
    mocks.getPresentation.mockResolvedValue({
      period: "2026-1",
      title: "Modo presentación",
      controls: { fullscreenEnabled: true, keyboardNavigationEnabled: true, nextKeys: ["ArrowRight"], previousKeys: ["ArrowLeft"], exitKeys: ["Escape"] },
      slides: [],
    });
    mocks.listGoals.mockResolvedValue([]);
    mocks.listObjectiveCards.mockResolvedValue([]);
  });

  it("loads only periods and the presentation contract", async () => {
    const result = await loadPresentationScreen("2026-1");

    expect(result.periods).toHaveLength(1);
    expect(result.presentation.period).toBe("2026-1");
    expect(mocks.getPresentation).toHaveBeenCalledWith({ period: "2026-1" });
    expect(mocks.listGoals).not.toHaveBeenCalled();
    expect(mocks.listObjectiveCards).not.toHaveBeenCalled();
  });
});
