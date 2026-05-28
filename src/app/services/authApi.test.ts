import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi, normalizeAuthMe } from "./authApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("auth API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.clear();
    localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({ user: {}, capabilities: {} }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests the current user with bearer auth", async () => {
    sessionStorage.setItem("sgp_access_token", "mock-token-ad");

    await authApi.me();

    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/auth/me`, expect.any(Object));
    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer mock-token-ad");
  });

  it("normalizes backend auth context into the local session shape", () => {
    const user = normalizeAuthMe(
      {
        user: {
          externalUserId: 10,
          username: "mte-admin",
          email: "demo.profesor@icesi.edu.co",
          roles: ["ADMIN"],
          permissions: ["CATALOGS_MANAGE"],
          professorName: "Profesor Demo",
          departmentName: "Departamento de Computación y Sistemas inteligentes.",
        },
        capabilities: { manageCatalogs: true, syncExternalProjects: false },
      },
      { token: "mock-token-ad", iniciales: "AD" },
    );

    expect(user).toMatchObject({
      id: "10",
      nombre: "Profesor Demo",
      correo: "demo.profesor@icesi.edu.co",
      rol: "administrador",
      departamento: "Departamento de Computación y Sistemas inteligentes.",
      iniciales: "AD",
      token: "mock-token-ad",
      roles: ["ADMIN"],
      permissions: ["CATALOGS_MANAGE"],
      capabilities: ["manageCatalogs"],
    });
  });

  it("falls back to the selected demo user when backend fields are sparse", () => {
    const user = normalizeAuthMe({ userContext: { roles: ["PROFESOR"] } }, {
      id: "U12",
      nombre: "Leonardo Bustamante",
      correo: "lbustamante@icesi.edu.co",
      rol: "tutor",
      departamento: "DCSI",
      iniciales: "LB",
      token: "mock-token-lb",
    });

    expect(user).toMatchObject({
      id: "U12",
      nombre: "Leonardo Bustamante",
      rol: "tutor",
      token: "mock-token-lb",
    });
  });
});
