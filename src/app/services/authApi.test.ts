import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi, authErrorMessage, normalizeAuthMe, sessionExpiry, type AuthMeResponse } from "./authApi";
import { ApiError } from "./strategicApi";

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
      rol: "admin",
      departamento: "Departamento de Computación y Sistemas inteligentes.",
      iniciales: "AD",
      token: "mock-token-ad",
      roles: ["ADMIN"],
      permissions: ["CATALOGS_MANAGE"],
      capabilities: ["manageCatalogs"],
    });
  });

  it("falls back to the known profile when backend fields are sparse", () => {
    const user = normalizeAuthMe({ userContext: { roles: ["PROFESOR"] } }, {
      id: "U12",
      nombre: "Leonardo Bustamante",
      correo: "lbustamante@icesi.edu.co",
      rol: "contributor",
      departamento: "DCSI",
      iniciales: "LB",
      token: "mock-token-lb",
    });

    expect(user).toMatchObject({
      id: "U12",
      nombre: "Leonardo Bustamante",
      rol: "contributor",
      token: "mock-token-lb",
    });
  });

  it.each([
    ["ADMIN", "admin"],
    ["DIRECTOR_ESCUELA", "manager"],
    ["JEFE_DPTO", "manager"],
    ["VISITOR", "visitor"],
    ["CONTRIBUTOR", "contributor"],
    ["unknown", "visitor"],
  ] as const)("normalizes the %s role", (role, expected) => {
    expect(normalizeAuthMe({ user: { roles: [role] } }).rol).toBe(expected);
  });

  it("deduplicates nullable arrays and accepts capability lists", () => {
    // Malformed payload on purpose: normalizeAuthMe must tolerate nulls its declared types exclude.
    const user = normalizeAuthMe({
      user: { roles: ["MANAGER", null, "MANAGER"], permissions: ["READ", undefined, "READ"] },
      capabilities: ["viewDashboard", null, "viewDashboard"],
    } as unknown as AuthMeResponse);

    expect(user.roles).toEqual(["MANAGER"]);
    expect(user.permissions).toEqual(["READ"]);
    expect(user.capabilities).toEqual(["viewDashboard"]);
  });

  it("uses each supported identity fallback and derives initials", () => {
    expect(normalizeAuthMe({ user: { externalProfessorId: 22, professorName: "Laura" } }).id).toBe("22");
    expect(normalizeAuthMe({ user: { username: "mte.user" } }).id).toBe("mte.user");
    expect(normalizeAuthMe({ user: { email: "mte@example.com" } }).id).toBe("mte@example.com");
    expect(normalizeAuthMe({}, { id: "fallback", nombre: "  Ana Maria  " })).toMatchObject({ id: "fallback", iniciales: "AM" });
    expect(normalizeAuthMe({})).toMatchObject({ id: "mte-user", nombre: "Usuario MTE", iniciales: "UM" });
  });

  it("normalizes fallback roles and empty capabilities", () => {
    expect(normalizeAuthMe({}, { rol: "administrador" as never }).rol).toBe("admin");
    expect(normalizeAuthMe({}, { rol: "gestor" as never }).rol).toBe("manager");
    expect(normalizeAuthMe({}, { rol: "otro" as never }).rol).toBe("visitor");
    expect(normalizeAuthMe({ capabilities: null }).capabilities).toEqual([]);
  });

  it("sends the fresh token explicitly when it is not stored yet", async () => {
    sessionStorage.setItem("sgp_access_token", "old-token");

    await authApi.me("fresh-token");

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer fresh-token");
  });

  it("posts credentials to the login endpoint", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ accessToken: "t", tokenType: "bearer", expiresIn: 3600, expiresAt: 0 }));

    const session = await authApi.login("ana@icesi.edu.co", "una-clave-larga");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${baseUrl}/auth/login`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "ana@icesi.edu.co", password: "una-clave-larga" });
    expect(session.accessToken).toBe("t");
  });

  it.each([
    ["logout", () => authApi.logout(), "/auth/logout", undefined],
    ["setPassword", () => authApi.setPassword("abc_123-XYZ", "invite", "una-clave-larga"), "/auth/set-password",
      { tokenHash: "abc_123-XYZ", type: "invite", password: "una-clave-larga" }],
    ["changePassword", () => authApi.changePassword("actual-clave-1", "nueva-clave-2"), "/auth/password",
      { currentPassword: "actual-clave-1", newPassword: "nueva-clave-2" }],
  ] as const)("%s posts to its endpoint and accepts an empty 204", async (_name, call, path, body) => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: vi.fn() } as unknown as Response);

    await expect(call()).resolves.toBeUndefined();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${baseUrl}${path}`);
    expect(options.method).toBe("POST");
    if (body) expect(JSON.parse(options.body)).toEqual(body);
  });

  it("converts the token expiry to milliseconds and falls back to the lifetime", () => {
    expect(sessionExpiry({ accessToken: "t", tokenType: "bearer", expiresIn: 3600, expiresAt: 1_800_000_000 })).toBe(1_800_000_000_000);
    expect(sessionExpiry({ accessToken: "t", tokenType: "bearer", expiresIn: 3600, expiresAt: 0 }, 1000)).toBe(3_601_000);
  });

  it("shows API messages and replaces technical failures with a readable one", () => {
    expect(authErrorMessage(new ApiError("El enlace no es válido o ya venció. Pide uno nuevo al administrador.", 400)))
      .toBe("El enlace no es válido o ya venció. Pide uno nuevo al administrador.");
    expect(authErrorMessage(new ApiError("Error 502", 502))).toMatch(/no respondió/);
    expect(authErrorMessage(new TypeError("Failed to fetch"))).toMatch(/No pudimos conectar/);
  });
});
