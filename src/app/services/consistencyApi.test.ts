import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consistencyApi } from "./consistencyApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    blob: vi.fn().mockResolvedValue(new Blob(["csv"])),
  } as unknown as Response;
}

describe("consistency API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("checks consistency with stable optional filters", async () => {
    fetchMock.mockResolvedValue(response({ summary: { total: 0 }, findings: [] }));

    await consistencyApi.check({ severity: "ALTA", module: "OKRS", staleDays: 30 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/consistency\/check\?(?=.*severity=ALTA)(?=.*module=OKRS)(?=.*staleDays=30)/),
      expect.any(Object),
    );
  });

  it("exports CSV with the session bearer and returns the response blob", async () => {
    sessionStorage.setItem("sgp_access_token", "access-token");
    const expected = new Blob(["finding"]);
    const ok = response({}, 200);
    vi.mocked(ok.blob).mockResolvedValue(expected);
    fetchMock.mockResolvedValue(ok);

    const result = await consistencyApi.exportCsv({ severity: "MEDIA" });

    expect(result).toBe(expected);
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/consistency/check/export.csv?severity=MEDIA`,
      expect.objectContaining({
        cache: "no-store",
        credentials: "omit",
        headers: expect.objectContaining({ Authorization: "Bearer access-token" }),
      }),
    );
  });

  it("omits authorization when the session has no bearer", async () => {
    fetchMock.mockResolvedValue(response({}, 200));

    await consistencyApi.exportCsv();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("surfaces the backend export error and falls back for a malformed body", async () => {
    fetchMock.mockResolvedValueOnce(response({ message: "Exportación bloqueada" }, 409));
    await expect(consistencyApi.exportCsv()).rejects.toThrow("Exportación bloqueada");

    const malformed = response({}, 500);
    vi.mocked(malformed.json).mockRejectedValue(new Error("invalid json"));
    fetchMock.mockResolvedValueOnce(malformed);
    await expect(consistencyApi.exportCsv()).rejects.toThrow("No se pudo exportar la consistencia");
  });
});
