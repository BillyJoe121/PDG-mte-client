import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  academicPeriodsApi,
  measurementUnitsApi,
} from "./catalogsApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function failingJsonResponse(status = 500) {
  return {
    ok: false,
    status,
    json: vi.fn().mockRejectedValue(new Error("invalid json")),
  } as unknown as Response;
}

describe("catalog APIs", () => {
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

  it("calls academic period endpoints with backend contract payloads", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-01", status: "ACTIVO" }]))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse(null, 204));

    await academicPeriodsApi.list();
    await academicPeriodsApi.create({ name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-01", status: "PLANIFICACION" });
    await academicPeriodsApi.update(2, { name: "2026-2", startDate: "2026-07-01", endDate: "2026-12-01", status: "ACTIVO" });
    await academicPeriodsApi.updateStatus(2, "CERRADO");
    await academicPeriodsApi.setActive(2, true);
    await academicPeriodsApi.remove(2);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/academic-periods`, expect.objectContaining({
      headers: expect.any(Headers),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/academic-periods`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-01", status: "PLANIFICACION" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/academic-periods/2`, expect.objectContaining({ method: "PUT" }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/academic-periods/2/status`, expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "CERRADO" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/academic-periods/2/active`, expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ active: true }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(6, `${baseUrl}/academic-periods/2`, expect.objectContaining({ method: "DELETE" }));
  });

  it("calls measurement unit endpoints with JSON payloads", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: "%", type: "PORCENTAJE", active: true }]))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse(null, 204));

    await measurementUnitsApi.list();
    await measurementUnitsApi.create({ name: "creditos", type: "NUMERICA", description: "Creditos academicos" });
    await measurementUnitsApi.update(2, { name: "creditos", type: "NUMERICA" });
    await measurementUnitsApi.setActive(2, false);
    await measurementUnitsApi.remove(2);

    const [, firstOptions] = fetchMock.mock.calls[0];
    expect((firstOptions.headers as Headers).get("Content-Type")).toBe("application/json");
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/measurement-units`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "creditos", type: "NUMERICA", description: "Creditos academicos" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/measurement-units/2`, expect.objectContaining({ method: "PUT" }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/measurement-units/2/active`, expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ active: false }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/measurement-units/2`, expect.objectContaining({ method: "DELETE" }));
  });

  it("throws ApiError with backend message on non-ok responses", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Nombre duplicado" }, 409));

    await expect(measurementUnitsApi.remove(1)).rejects.toMatchObject({
      name: "ApiError",
      message: "Nombre duplicado",
      status: 409,
    } satisfies Partial<ApiError>);
  });

  it("falls back to status when catalog error payload is unreadable", async () => {
    fetchMock.mockResolvedValueOnce(failingJsonResponse(503));

    await expect(academicPeriodsApi.list()).rejects.toMatchObject({
      name: "ApiError",
      message: "Error 503",
      status: 503,
    } satisfies Partial<ApiError>);
  });

  it("returns undefined for no-content catalog deletes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204));

    await expect(academicPeriodsApi.remove(2)).resolves.toBeUndefined();
  });

  it("adds the session token as bearer auth when present", async () => {
    sessionStorage.setItem("sgp_access_token", "abc123");

    await academicPeriodsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer abc123");
  });

  it("uses app local storage token when the session token is absent", async () => {
    localStorage.setItem("sgp_access_token", "local-app-token");

    await measurementUnitsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer local-app-token");
  });

  it("uses the legacy local storage token when newer token keys are absent", async () => {
    localStorage.setItem("token", "legacy-token");

    await academicPeriodsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer legacy-token");
  });

  it("adds bearer auth on catalog writes as well", async () => {
    sessionStorage.setItem("sgp_access_token", "session-token");

    await measurementUnitsApi.create({ name: "Unidad", type: "OTRA" });

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer session-token");
  });

  it("sets JSON content type even when custom headers are absent", async () => {
    await measurementUnitsApi.setActive(5, true);

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("survives blocked storage while calling catalog endpoints", async () => {
    vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    await academicPeriodsApi.list();

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).has("Authorization")).toBe(false);
  });
});
