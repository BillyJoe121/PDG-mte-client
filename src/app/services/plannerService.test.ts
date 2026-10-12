import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLANNER_URL,
  buildPlannerUrl,
  getPlannerConfig,
  isPlannerLinked,
  navigateToPlanner,
  savePlannerConfig,
  setEntityPlannerLink,
} from "./plannerService";

describe("plannerService", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns default configuration when storage is empty", () => {
    const config = getPlannerConfig();
    expect(config.defaultPlannerBaseUrl).toBe(DEFAULT_PLANNER_URL);
    expect(config.customLinks).toEqual({});
  });

  it("uses entity plannerUrl when provided directly", () => {
    const url = buildPlannerUrl("PROJECT", {
      id: 10,
      name: "Proyecto Alpha",
      plannerUrl: "https://tasks.office.com/icesi.edu.co/Home/PlanViews/abc-123",
    });
    expect(url).toBe("https://tasks.office.com/icesi.edu.co/Home/PlanViews/abc-123");
    expect(isPlannerLinked("PROJECT", { id: 10, plannerUrl: "https://tasks.office.com/icesi.edu.co/Home/PlanViews/abc-123" })).toBe(true);
  });

  it("constructs plan URL when plannerPlanId is provided", () => {
    savePlannerConfig({ tenantId: "icesi.edu.co" });
    const url = buildPlannerUrl("KEY_RESULT", {
      id: 4,
      name: "KR Cobertura",
      plannerPlanId: "plan-xyz-789",
    });
    expect(url).toBe("https://tasks.office.com/icesi.edu.co/Home/PlanViews/plan-xyz-789");
  });

  it("allows setting and resolving custom entity links via storage", () => {
    setEntityPlannerLink("PROJECT", 25, "https://tasks.office.com/custom/plan");
    expect(isPlannerLinked("PROJECT", { id: 25 })).toBe(true);
    expect(buildPlannerUrl("PROJECT", { id: 25 })).toBe("https://tasks.office.com/custom/plan");

    // Setting plan ID only
    setEntityPlannerLink("KEY_RESULT", 99, "plan-99-id");
    expect(buildPlannerUrl("KEY_RESULT", { id: 99 })).toBe("https://tasks.office.com/Home/PlanViews/plan-99-id");
  });

  it("falls back to default planner portal if no link is configured", () => {
    const url = buildPlannerUrl("KEY_RESULT", { id: 1 });
    expect(url).toBe(DEFAULT_PLANNER_URL);
    expect(isPlannerLinked("KEY_RESULT", { id: 1 })).toBe(false);
  });

  it("navigates and triggers notification callback", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const notifySpy = vi.fn();

    const result = navigateToPlanner(
      "PROJECT",
      { id: 7, name: "Modernización MTE" },
      { notify: notifySpy }
    );

    expect(result.url).toBe(DEFAULT_PLANNER_URL);
    expect(result.isLinked).toBe(false);
    expect(openSpy).toHaveBeenCalledWith(DEFAULT_PLANNER_URL, "_blank", "noopener,noreferrer");
    expect(notifySpy).toHaveBeenCalled();
  });
});
