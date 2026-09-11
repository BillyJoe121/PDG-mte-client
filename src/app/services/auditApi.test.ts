import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditApi } from "./auditApi";

const baseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("auditApi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.clear();
    fetchMock.mockReset().mockResolvedValue(jsonResponse([]));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serializes the same audit filters for logs and summary", async () => {
    const filters = {
      action: "UPDATE" as const,
      entityType: "OBJECTIVE",
      entityId: "12",
      actorUsername: "admin",
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-04-30T23:59:59.999Z",
    };

    await auditApi.list(filters);
    await auditApi.summary(filters);

    const query = "action=UPDATE&entityType=OBJECTIVE&entityId=12&actorUsername=admin&from=2026-04-01T00%3A00%3A00.000Z&to=2026-04-30T23%3A59%3A59.999Z";
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/audit-logs?${query}`, expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/audit-logs/summary?${query}`, expect.any(Object));
  });

  it("omits empty filters", async () => {
    await auditApi.list({ entityType: " ", actorUsername: "" });
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/audit-logs`, expect.any(Object));
  });
});
