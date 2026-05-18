import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  api,
  departmentsApi,
  goalsApi,
  hierarchyApi,
  keyResultsApi,
  objectivesApi,
  strategicBetsApi,
} from "./strategicApi";

const baseUrl = "http://localhost:8081/api/v1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("strategic hierarchy APIs", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.clear();
    localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls strategic bet and goal endpoints", async () => {
    await strategicBetsApi.list("2026-1");
    await strategicBetsApi.create({ name: "Apuesta", description: "Descripcion", startDate: "2026-01-01" });
    await strategicBetsApi.get(7, "2026-1");
    await goalsApi.list();
    await goalsApi.create({ name: "Meta", description: "Desc", expectedValue: 10, measurementUnitId: 2 });
    await goalsApi.get(3);
    await goalsApi.attachPeriod(3, 1);
    await goalsApi.detachPeriod(3, 1);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/strategic-bets?period=2026-1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/strategic-bets`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "Apuesta", description: "Descripcion", startDate: "2026-01-01" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/strategic-bets/7?period=2026-1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/goals`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/goals`, expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(6, `${baseUrl}/goals/3`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(7, `${baseUrl}/goals/3/periods/1`, expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(8, `${baseUrl}/goals/3/periods/1`, expect.objectContaining({ method: "DELETE" }));
  });

  it("calls objective, key result, hierarchy and department endpoints", async () => {
    const kr = { name: "KR", description: "Desc", metric: "Metric", baseValue: 0, targetValue: 100, measurementUnitId: 1 };

    await objectivesApi.list({ strategicBetId: 1, goalId: 2, departmentId: 3, periodId: 4 });
    await objectivesApi.cards({ periodId: 4 });
    await objectivesApi.create({ name: "Obj", description: "Desc", departmentId: 1, academicPeriodId: 2, goalId: 3, strategicBetId: 4, keyResults: [kr] });
    await objectivesApi.get(8);
    await objectivesApi.update(8, { name: "Nuevo", description: "Nueva desc" });
    await objectivesApi.keyResults(8);
    await objectivesApi.addKeyResult(8, kr);
    await objectivesApi.coverageTrend(8);
    await keyResultsApi.update(9, kr);
    await keyResultsApi.remove(9);
    await hierarchyApi.tree("2026-1");
    await departmentsApi.list();

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/objectives?strategicBetId=1&goalId=2&departmentId=3&periodId=4`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/objectives/cards?periodId=4`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/objectives`, expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/objectives/8`, expect.objectContaining({ method: "PATCH" }));
    expect(fetchMock).toHaveBeenNthCalledWith(7, `${baseUrl}/objectives/8/key-results`, expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(9, `${baseUrl}/key-results/9`, expect.objectContaining({ method: "PUT" }));
    expect(fetchMock).toHaveBeenNthCalledWith(10, `${baseUrl}/key-results/9`, expect.objectContaining({ method: "DELETE" }));
    expect(fetchMock).toHaveBeenNthCalledWith(11, `${baseUrl}/strategic-hierarchy/tree?period=2026-1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(12, `${baseUrl}/departments`, expect.any(Object));
  });

  it("throws ApiError with backend message", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "No autorizado" }, 403));

    await expect(objectivesApi.get(1)).rejects.toMatchObject({
      name: "ApiError",
      message: "No autorizado",
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it.each([
    ["strategic bets without period", () => strategicBetsApi.list(), `${baseUrl}/strategic-bets`],
    ["strategic bet detail without period", () => strategicBetsApi.get(7), `${baseUrl}/strategic-bets/7`],
    ["goals with period", () => goalsApi.list("2026-2"), `${baseUrl}/goals?period=2026-2`],
    ["goal detail with period", () => goalsApi.get(3, "2026-2"), `${baseUrl}/goals/3?period=2026-2`],
    ["hierarchy without period", () => hierarchyApi.tree(), `${baseUrl}/strategic-hierarchy/tree`],
  ])("handles optional period branch for %s", async (_caseName, call, expectedUrl) => {
    await call();

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  });

  it.each([
    ["objective list without params", () => objectivesApi.list(), `${baseUrl}/objectives`],
    ["objective list empty filters", () => objectivesApi.list({ strategicBetId: undefined, goalId: undefined }), `${baseUrl}/objectives`],
    ["objective list zero filter", () => objectivesApi.list({ departmentId: 0 }), `${baseUrl}/objectives?departmentId=0`],
    ["objective cards without params", () => objectivesApi.cards(), `${baseUrl}/objectives/cards`],
    ["objective cards empty filters", () => objectivesApi.cards({ periodId: undefined }), `${baseUrl}/objectives/cards`],
  ])("builds objective query branch for %s", async (_caseName, call, expectedUrl) => {
    await call();

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  });

  it("returns undefined for no-content strategic deletes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204));

    await expect(keyResultsApi.remove(9)).resolves.toBeUndefined();
  });

  it("falls back to status when strategic error JSON cannot be read", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new Error("bad json")),
    } as unknown as Response);

    await expect(departmentsApi.list()).rejects.toMatchObject({
      name: "ApiError",
      message: "Error 502",
      status: 502,
    } satisfies Partial<ApiError>);
  });

  it("adds session auth to strategic requests", async () => {
    sessionStorage.setItem("sgp_access_token", "session-token");

    await departmentsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer session-token");
  });

  it("uses app local storage auth when session auth is missing", async () => {
    localStorage.setItem("sgp_access_token", "app-local-token");

    await departmentsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer app-local-token");
  });

  it("uses legacy local storage auth as the final token fallback", async () => {
    localStorage.setItem("token", "legacy-token");

    await departmentsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer legacy-token");
  });

  it("does not add auth when storage access throws", async () => {
    vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    await departmentsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).has("Authorization")).toBe(false);
  });

  it("preserves explicit Authorization headers passed to the low-level API", async () => {
    sessionStorage.setItem("sgp_access_token", "session-token");

    await api("/departments", {
      headers: { Authorization: "Bearer explicit-token" },
    });

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer explicit-token");
  });
});
