import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { directoryUsersApi } from "./peopleApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

describe("directory users filters", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockResolvedValue([]) } as unknown as Response);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the plain collection when no filter is given", async () => {
    await directoryUsersApi.list();
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/directory-users`, expect.any(Object));
  });

  it("ignores a blank search and trims a padded one", async () => {
    await directoryUsersApi.list({ search: "   " });
    expect(fetchMock).toHaveBeenLastCalledWith(`${baseUrl}/directory-users`, expect.any(Object));

    await directoryUsersApi.list({ search: "  Ana  " });
    expect(fetchMock).toHaveBeenLastCalledWith(`${baseUrl}/directory-users?search=Ana`, expect.any(Object));
  });

  it("keeps falsy but defined filters", async () => {
    await directoryUsersApi.list({ departmentId: 0, active: false });
    expect(fetchMock).toHaveBeenLastCalledWith(`${baseUrl}/directory-users?departmentId=0&active=false`, expect.any(Object));
  });
});
