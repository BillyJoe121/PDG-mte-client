import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  api,
  departmentsApi,
  goalsApi,
  hierarchyApi,
  createKeyResult,
  keyResultsApi,
  listKeyResults,
  strategicBetsApi,
} from "./strategicApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

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
    await strategicBetsApi.update(7, { name: "Apuesta editada", description: "Nueva descripcion" });
    await goalsApi.list();
    await goalsApi.create({ name: "Meta", description: "Desc", referenceIndicator: "Indicador", expectedValue: 10, measurementUnitId: 2 });
    await goalsApi.get(3);
    await goalsApi.update(3, { name: "Meta editada", description: "Desc editada", referenceIndicator: "Indicador", expectedValue: 12, measurementUnitId: 2 });
    await goalsApi.attachPeriod(3, 1);
    await goalsApi.detachPeriod(3, 1);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/strategic-bets?period=2026-1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/strategic-bets`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "Apuesta", description: "Descripcion", startDate: "2026-01-01" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/strategic-bets/7?period=2026-1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/strategic-bets/7`, expect.objectContaining({ method: "PUT" }));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/goals`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(6, `${baseUrl}/goals`, expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(7, `${baseUrl}/goals/3`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(8, `${baseUrl}/goals/3`, expect.objectContaining({ method: "PUT" }));
    expect(fetchMock).toHaveBeenNthCalledWith(9, `${baseUrl}/goals/3/periods/1`, expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(10, `${baseUrl}/goals/3/periods/1`, expect.objectContaining({ method: "DELETE" }));
  });

  it("calls key result, hierarchy and department endpoints", async () => {
    const kr = {
      name: "KR",
      description: "Desc",
      metric: "Metric",
      baseValue: 0,
      targetValue: 100,
      measurementUnitId: 1,
      academicPeriodId: 2,
      goalIds: [3],
      strategicBetIds: [],
    };

    await keyResultsApi.update(9, kr);
    await keyResultsApi.updateCurrentValue(9, 42);
    await keyResultsApi.remove(9);
    await hierarchyApi.tree("2026-1");
    await departmentsApi.list();

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/key-results/9`, expect.objectContaining({ method: "PUT", body: JSON.stringify(kr) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/key-results/9/current-value`, expect.objectContaining({ method: "PATCH", body: JSON.stringify({ currentValue: 42 }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/key-results/9`, expect.objectContaining({ method: "DELETE" }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/strategic-hierarchy/tree?period=2026-1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/departments`, expect.any(Object));
  });

  it("lists key results with optional goal, bet and period filters", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await listKeyResults();
    await listKeyResults({ goalId: 3 });
    await listKeyResults({ goalId: 3, strategicBetId: 4, periodId: 5 });
    await keyResultsApi.list({ strategicBetId: undefined, periodId: 5 });

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/key-results`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/key-results?goalId=3`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/key-results?goalId=3&strategicBetId=4&periodId=5`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/key-results?periodId=5`, expect.any(Object));
  });

  it("creates a key result linked to Metas and Apuestas", async () => {
    const body = {
      name: "KR",
      description: "Desc",
      metric: "Metric",
      baseValue: 0,
      targetValue: 100,
      measurementUnitId: 1,
      academicPeriodId: 2,
      goalIds: [3, 4],
      strategicBetIds: [7],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 11, goals: [{ id: 3, name: "Meta" }], strategicBets: [{ id: 7, name: "Apuesta" }] }, 201));

    const created = await createKeyResult(body);

    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/key-results`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify(body),
    }));
    expect(created.goals).toEqual([{ id: 3, name: "Meta" }]);
    expect(created.strategicBets).toEqual([{ id: 7, name: "Apuesta" }]);
  });

  it("loads a key result with its Metas and Apuestas", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: 9,
      name: "KR",
      goals: [{ id: 3, name: "Meta" }],
      strategicBets: [],
    }));

    const result = await keyResultsApi.get(9);

    expect(result.goals).toEqual([{ id: 3, name: "Meta" }]);
    expect(result.strategicBets).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/key-results/9`, expect.any(Object));
  });

  it("changes key result lifecycle status through explicit contracts", async () => {
    await keyResultsApi.setStatus(9, "CERRADO");

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/key-results/9/status`, expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "CERRADO" }),
    }));
  });

  it("throws ApiError with backend message", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "No autorizado" }, 403));

    await expect(keyResultsApi.get(1)).rejects.toMatchObject({
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

  it("returns undefined for no-content strategic deletes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204));

    await expect(keyResultsApi.remove(9)).resolves.toBeUndefined();
  });

  it("supports soft delete and recovery endpoints", async () => {
    await strategicBetsApi.list(undefined, true);
    await strategicBetsApi.setActive(7, false);
    await goalsApi.list(undefined, true);
    await goalsApi.setActive(3, true);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/strategic-bets?includeInactive=true`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/strategic-bets/7/active`, expect.objectContaining({ method: "PATCH", body: JSON.stringify({ active: false }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/goals?includeInactive=true`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/goals/3/active`, expect.objectContaining({ method: "PATCH", body: JSON.stringify({ active: true }) }));
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

  it("ignores app local storage auth when session auth is missing", async () => {
    localStorage.setItem("sgp_access_token", "app-local-token");

    await departmentsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).has("Authorization")).toBe(false);
  });

  it("ignores legacy local storage auth", async () => {
    localStorage.setItem("token", "legacy-token");

    await departmentsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).has("Authorization")).toBe(false);
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
