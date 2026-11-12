import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, departmentsApi, schoolsApi } from "./strategicApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

function failure(status: number, body: unknown = { message: "Falla" }) {
  return {
    ok: false,
    status,
    statusText: "Failure",
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("strategic API failure diagnostics", () => {
  const fetchMock = vi.fn();
  let group: ReturnType<typeof vi.spyOn>;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    sessionStorage.clear();
    group = vi.spyOn(console, "groupCollapsed").mockImplementation(() => undefined);
    log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "groupEnd").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const logged = (label: string) => log.mock.calls.find(([name]: unknown[]) => name === label)?.[1];

  it("logs a masked token, the parsed body and the stored session for a failed write", async () => {
    sessionStorage.setItem("sgp_access_token", "abcdefghijklmnopqrstuvwxyz");
    sessionStorage.setItem("sgp_session_user", JSON.stringify({ id: "1", nombre: "Ana", rol: "admin", roles: ["admin"] }));
    fetchMock.mockResolvedValue(failure(400));

    await expect(api("/things", { method: "POST", body: JSON.stringify({ a: 1 }) })).rejects.toMatchObject({ status: 400, message: "Falla" });

    expect(group).toHaveBeenCalledWith(expect.stringContaining(`POST ${baseUrl}/things -> 400 Failure`));
    expect(logged("request")).toMatchObject({ hasToken: true, token: "abcdefgh...wxyz", body: { a: 1 } });
    expect(logged("session")).toMatchObject({ id: "1", nombre: "Ana", roles: ["admin"] });
    expect(logged("backendError")).toEqual({ message: "Falla" });
  });

  it("masks short tokens and keeps non-JSON or missing bodies as they are", async () => {
    sessionStorage.setItem("sgp_access_token", "short");
    fetchMock.mockResolvedValue(failure(500, null));

    await expect(api("/a", { method: "POST", body: "not json" })).rejects.toMatchObject({ message: "Error 500" });
    expect(logged("request")).toMatchObject({ token: "sho...", body: "not json" });
    expect(logged("session")).toBeNull();

    log.mockClear();
    await expect(api("/b")).rejects.toMatchObject({ status: 500 });
    expect(logged("request")).toMatchObject({ body: null, method: "GET" });

    log.mockClear();
    const params = new URLSearchParams({ x: "1" });
    await expect(api("/c", { method: "POST", body: params })).rejects.toMatchObject({ status: 500 });
    expect(logged("request")).toMatchObject({ body: params });
  });

  it("logs without a token when the session has none", async () => {
    fetchMock.mockResolvedValue(failure(404));

    await expect(api("/missing")).rejects.toMatchObject({ status: 404 });

    expect(logged("request")).toMatchObject({ hasToken: false, token: null });
  });

  it("reports an unreadable stored session instead of throwing", async () => {
    sessionStorage.setItem("sgp_session_user", "{broken");
    fetchMock.mockResolvedValue(failure(400));

    await expect(api("/x")).rejects.toMatchObject({ status: 400 });
    expect(logged("session")).toEqual({ error: expect.any(String) });

    sessionStorage.setItem("sgp_session_user", "null");
    vi.spyOn(JSON, "parse").mockImplementationOnce(() => {
      throw "plain failure";
    });
    log.mockClear();
    await expect(api("/x")).rejects.toMatchObject({ status: 400 });
    expect(logged("session")).toEqual({ error: "No se pudo leer la sesion" });
  });

  it("stays silent outside development builds", async () => {
    vi.stubEnv("DEV", false);
    fetchMock.mockResolvedValue(failure(400));

    await expect(api("/x")).rejects.toMatchObject({ status: 400 });

    expect(group).not.toHaveBeenCalled();
  });

  it("works without a window object", async () => {
    vi.stubGlobal("window", undefined);
    sessionStorage.setItem("sgp_access_token", "tok-without-window");
    sessionStorage.setItem("sgp_session_user", JSON.stringify({ id: "2" }));
    fetchMock.mockResolvedValue(failure(401));

    await expect(api("/x")).rejects.toMatchObject({ status: 401 });

    expect(logged("session")).toMatchObject({ id: "2" });
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer tok-without-window");
  });

  it("creates and updates departments and lists schools", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ id: 1 }) } as unknown as Response);
    const department = { name: "DCSI", schoolId: 2 } as Parameters<typeof departmentsApi.create>[0];

    await departmentsApi.create(department);
    await departmentsApi.update(5, department);
    await schoolsApi.list();

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/departments`, expect.objectContaining({ method: "POST", body: JSON.stringify(department) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/departments/5`, expect.objectContaining({ method: "PUT" }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/schools`, expect.any(Object));
  });
});
