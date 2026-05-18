import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardApi } from "./dashboardApi";

const baseUrl = "http://localhost:8081/api/v1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("dashboard API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.clear();
    localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({}));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls dashboard endpoints without period for active period", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ period: "2026-1" }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    await dashboardApi.load();

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/dashboard/summary`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/dashboard/projects/by-status`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/dashboard/key-results/by-progress`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/dashboard/departments/summary`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/dashboard/strategic-bets/summary`, expect.any(Object));
  });

  it("adds the selected period as query param", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await dashboardApi.projectsByStatus("2026-Q3");

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/dashboard/projects/by-status?period=2026-Q3`,
      expect.any(Object),
    );
  });

  it("uses the bearer token from storage", async () => {
    sessionStorage.setItem("sgp_access_token", "abc123");

    await dashboardApi.summary("2026-1");

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer abc123");
  });
});
