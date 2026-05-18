import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  projectContributionApi,
  projectKeyResultLinksApi,
  projectsApi,
  validateProjectKeyResultLink,
} from "./projectsApi";

const baseUrl = "http://localhost:8081/api/v1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("projects APIs", () => {
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

  it("calls project endpoints with backend contract params and payloads", async () => {
    const createPayload = {
      name: "Proyecto",
      description: "Descripcion",
      type: "INVESTIGACION" as const,
      departmentId: 1,
      status: "ACTIVO" as const,
      startPeriod: "2026-1",
      endPeriod: "2026-2",
      tutors: ["Tutora A"],
      keyResultLinks: [{ keyResultId: 10, contributionWeight: 40, contributionType: "DIRECTA" as const }],
    };

    await projectsApi.list({ search: "analitica", status: "ACTIVO", type: "INVESTIGACION", departmentId: 1, period: "2026-2" });
    await projectsApi.get(1);
    await projectsApi.detail(1);
    await projectsApi.create(createPayload);
    await projectsApi.update(1, { ...createPayload, actualEndDate: null });
    await projectsApi.updateStatus(1, "FINALIZADO");
    await projectsApi.registerProgress(1, { progressPercent: 64.5, comment: "Avance", milestones: "Prototipo" });
    await projectsApi.history(1);
    await projectsApi.contributionChain(1);
    await projectContributionApi.contributionChain(1);
    await projectContributionApi.impactChain(1);
    await projectsApi.syncTrayectoria();

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/projects?search=analitica&status=ACTIVO&type=INVESTIGACION&departmentId=1&period=2026-2`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/projects/1`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/projects/1/detail`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, `${baseUrl}/projects`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify(createPayload),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(5, `${baseUrl}/projects/1`, expect.objectContaining({ method: "PUT" }));
    expect(fetchMock).toHaveBeenNthCalledWith(6, `${baseUrl}/projects/1/status`, expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ status: "FINALIZADO" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(7, `${baseUrl}/projects/1/progress`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ progressPercent: 64.5, comment: "Avance", milestones: "Prototipo" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(8, `${baseUrl}/projects/1/history`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(9, `${baseUrl}/projects/1/contribution-chain`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(10, `${baseUrl}/projects/1/contribution-chain`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(11, `${baseUrl}/projects/1/impact-chain`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(12, `${baseUrl}/projects/sync/trayectoria`, expect.objectContaining({ method: "POST" }));
  });

  it("calls project-key-result link endpoints", async () => {
    await projectKeyResultLinksApi.list({ projectId: 1, keyResultId: 10 });
    await projectKeyResultLinksApi.create({ projectId: 1, keyResultId: 10, contributionWeight: 35, contributionType: "SOPORTE" });
    await projectKeyResultLinksApi.remove(7);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/project-key-result-links?projectId=1&keyResultId=10`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/project-key-result-links`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ projectId: 1, keyResultId: 10, contributionWeight: 35, contributionType: "SOPORTE" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${baseUrl}/project-key-result-links/7`, expect.objectContaining({ method: "DELETE" }));
  });

  it.each([
    ["missing project", { projectId: 0, keyResultId: 10, contributionWeight: 20, contributionType: "DIRECTA" as const }, "Selecciona un proyecto."],
    ["missing key result", { projectId: 1, keyResultId: 0, contributionWeight: 20, contributionType: "DIRECTA" as const }, "Selecciona un Key Result."],
    ["negative weight", { projectId: 1, keyResultId: 10, contributionWeight: -1, contributionType: "DIRECTA" as const }, "El peso debe estar entre 0 y 100."],
    ["overweight", { projectId: 1, keyResultId: 10, contributionWeight: 101, contributionType: "DIRECTA" as const }, "El peso debe estar entre 0 y 100."],
    ["missing contribution type", { projectId: 1, keyResultId: 10, contributionWeight: 20, contributionType: "" as never }, "Selecciona el tipo de contribucion."],
  ])("validates project-key-result links: %s", (_caseName, payload, expected) => {
    expect(validateProjectKeyResultLink(payload)).toBe(expected);
  });

  it("accepts project-key-result links at the inclusive weight boundaries", () => {
    expect(validateProjectKeyResultLink({ projectId: 1, keyResultId: 10, contributionWeight: 0, contributionType: "INDIRECTA" })).toBeNull();
    expect(validateProjectKeyResultLink({ projectId: 1, keyResultId: 10, contributionWeight: 100, contributionType: "SOPORTE" })).toBeNull();
  });

  it.each([
    ["without params", undefined, `${baseUrl}/projects`],
    ["with empty values", { search: "", period: "", status: undefined }, `${baseUrl}/projects`],
    ["with only status", { status: "BORRADOR" as const }, `${baseUrl}/projects?status=BORRADOR`],
    ["with numeric zero preserved", { departmentId: 0 }, `${baseUrl}/projects?departmentId=0`],
  ])("builds project list query %s", async (_caseName, params, expectedUrl) => {
    await projectsApi.list(params);

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  });

  it.each([
    ["without params", undefined, `${baseUrl}/project-key-result-links`],
    ["with only project", { projectId: 5 }, `${baseUrl}/project-key-result-links?projectId=5`],
    ["with only key result", { keyResultId: 11 }, `${baseUrl}/project-key-result-links?keyResultId=11`],
  ])("builds project-key-result link query %s", async (_caseName, params, expectedUrl) => {
    await projectKeyResultLinksApi.list(params);

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  });

  it("throws backend errors from project endpoints", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Proyecto no encontrado" }, 404));

    await expect(projectsApi.detail(99)).rejects.toMatchObject({
      name: "ApiError",
      message: "Proyecto no encontrado",
      status: 404,
    });
  });

  it("falls back to status text when project error JSON is invalid", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("bad json")),
    } as unknown as Response);

    await expect(projectsApi.get(1)).rejects.toMatchObject({
      message: "Error 500",
      status: 500,
    });
  });

  it("returns undefined for no-content deletes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204));

    await expect(projectKeyResultLinksApi.remove(7)).resolves.toBeUndefined();
  });
});
