import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PERIOD_REGEX, downloadReport, presentationApi, qs, reportsApi } from "./reportsApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function blobResponse(body: Blob, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue({}),
    blob: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("reports and presentation APIs", () => {
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

  it("calls reports endpoints with filters", async () => {
    await reportsApi.general({ period: "2026-1", departmentId: 2, objectiveId: 3 });
    await reportsApi.departments({ period: "2026-Q1" });
    await reportsApi.objectiveRanking({ period: "2026-2", departmentId: 4 });
    await reportsApi.periodComparison({ basePeriod: "2026-1", comparePeriod: "2026-2", objectiveId: 9 });
    await reportsApi.consolidated({ period: "2026-1" });

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/reports/general?period=2026-1&departmentId=2&objectiveId=3`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/reports/departments?period=2026-Q1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/reports/objectives/ranking?period=2026-2&departmentId=4`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/reports/period-comparison?basePeriod=2026-1&comparePeriod=2026-2&objectiveId=9`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/reports?period=2026-1`, expect.any(Object));
  });

  it("calls presentation endpoint with active or selected period", async () => {
    await presentationApi.get();
    await presentationApi.get({ period: "2026-Q3" });

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/presentation`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/presentation?period=2026-Q3`, expect.any(Object));
  });

  it("downloads exported reports with auth header", async () => {
    const click = vi.fn();
    const anchor = { click, href: "", download: "" };
    localStorage.setItem("token", "legacy-token");
    fetchMock.mockResolvedValueOnce(blobResponse(new Blob(["id,name"])));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLAnchorElement);

    await downloadReport("csv", { period: "2026-1", departmentId: 7 });

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/reports/export.csv?period=2026-1&departmentId=7`,
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer legacy-token" }),
      }),
    );
    expect(anchor.download).toBe("msp-report.csv");
    expect(click).toHaveBeenCalled();
  });

  it.each([
    ["academic semester", "2026-1", true],
    ["academic second semester", "2026-2", true],
    ["quarter", "2026-Q4", true],
    ["bad quarter", "2026-Q5", false],
    ["missing year", "Q1", false],
    ["empty", "", false],
  ])("validates period format: %s", (_caseName, period, expected) => {
    expect(PERIOD_REGEX.test(period)).toBe(expected);
  });

  it.each([
    ["empty params", {}, ""],
    ["undefined and null omitted", { period: undefined, departmentId: null }, ""],
    ["empty string omitted", { period: "", departmentId: 3 }, "?departmentId=3"],
    ["numeric zero preserved", { departmentId: 0, objectiveId: 0 }, "?departmentId=0&objectiveId=0"],
    ["all values encoded", { period: "2026 Q1", departmentId: 7 }, "?period=2026+Q1&departmentId=7"],
  ])("builds report query strings: %s", (_caseName, params, expected) => {
    expect(qs(params)).toBe(expected);
  });

  it.each([
    ["csv without filters", "csv" as const, {}, `${baseUrl}/reports/export.csv`],
    ["pdf with objective", "pdf" as const, { objectiveId: 9 }, `${baseUrl}/reports/export.pdf?objectiveId=9`],
    ["csv with empty filter omitted", "csv" as const, { period: "", departmentId: 2 }, `${baseUrl}/reports/export.csv?departmentId=2`],
  ])("builds export URL for %s", (_caseName, format, params, expected) => {
    expect(reportsApi.exportUrl(format, params)).toBe(expected);
  });

  it("downloads PDF exports with the session token before legacy storage", async () => {
    const click = vi.fn();
    const anchor = { click, href: "", download: "" };
    sessionStorage.setItem("sgp_access_token", "session-token");
    localStorage.setItem("token", "legacy-token");
    fetchMock.mockResolvedValueOnce(blobResponse(new Blob(["pdf"])));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLAnchorElement);

    await downloadReport("pdf");

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/reports/export.pdf`,
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(anchor.download).toBe("msp-report.pdf");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });

  it("downloads without an auth header when no token exists", async () => {
    const click = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue({ click, href: "", download: "" } as unknown as HTMLAnchorElement);
    fetchMock.mockResolvedValueOnce(blobResponse(new Blob(["id,name"])));

    await downloadReport("csv");

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/reports/export.csv`,
      expect.objectContaining({ cache: "no-store", headers: { "Content-Type": "application/json" } }),
    );
    expect(click).toHaveBeenCalled();
  });

  it("uses the generic export error when the backend has no message", async () => {
    fetchMock.mockResolvedValueOnce(blobResponse(new Blob([]), 500));

    await expect(downloadReport("csv")).rejects.toThrow("No se pudo exportar el reporte");
  });

  it("uses the backend export error message when available", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({ message: "Periodo invalido" }),
      blob: vi.fn(),
    } as unknown as Response);

    await expect(downloadReport("pdf", { period: "mal" })).rejects.toThrow("Periodo invalido");
  });

  it("keeps exporting resilient when storage access throws", async () => {
    const click = vi.fn();
    vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue({ click, href: "", download: "" } as unknown as HTMLAnchorElement);
    fetchMock.mockResolvedValueOnce(blobResponse(new Blob(["id,name"])));

    await downloadReport("csv");

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/reports/export.csv`,
      expect.objectContaining({ cache: "no-store", headers: { "Content-Type": "application/json" } }),
    );
  });
});
