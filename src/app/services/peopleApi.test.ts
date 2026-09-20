import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { directoryUsersApi } from "./peopleApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

describe("directory users API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    sessionStorage.setItem("sgp_access_token", "mock-token-ad");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockResolvedValue([]) } as unknown as Response);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serializes directory filters", async () => {
    await directoryUsersApi.list({ search: "Ana", departmentId: 2, accessRole: "MANAGER", active: true });

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/directory-users?search=Ana&departmentId=2&accessRole=MANAGER&active=true`,
      expect.any(Object),
    );
  });

  it("uses typed mutation contracts", async () => {
    const payload = { name: "Ana", email: "ana@icesi.edu.co", departmentId: 2, accessRole: "CONTRIBUTOR" as const, active: true };

    await directoryUsersApi.create(payload);
    await directoryUsersApi.update(8, { ...payload, accessRole: "MANAGER" });
    await directoryUsersApi.setActive(8, false);
    await directoryUsersApi.remove(8);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${baseUrl}/directory-users`,
      `${baseUrl}/directory-users/8`,
      `${baseUrl}/directory-users/8/active`,
      `${baseUrl}/directory-users/8`,
    ]);
    expect(fetchMock.mock.calls.map(([, options]) => options.method)).toEqual(["POST", "PUT", "PATCH", "DELETE"]);
  });
});
