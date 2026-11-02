import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLANNER_URL_MAX_LENGTH,
  normalizePlannerUrl,
  openPlannerUrl,
  validatePlannerUrl,
} from "./plannerService";

describe("validatePlannerUrl", () => {
  it("treats a blank link as valid because it clears the link", () => {
    expect(validatePlannerUrl("")).toBeNull();
    expect(validatePlannerUrl("   ")).toBeNull();
    expect(validatePlannerUrl(null)).toBeNull();
    expect(validatePlannerUrl(undefined)).toBeNull();
  });

  it.each([
    "https://tasks.office.com/icesi.edu.co/Home/PlanViews/abc-123",
    "https://planner.cloud.microsoft/webui/plan/abc",
    "https://office.com/planner",
    "https://www.office365.com/planner",
    "https://icesi.sharepoint.com/sites/mte",
    "https://www.microsoft.com/planner",
    "https://tasks.cloud.microsoft/plan/1",
    "https://TASKS.OFFICE.COM:443/plan",
    "  https://tasks.office.com/plan  ",
  ])("accepts %s", (url) => {
    expect(validatePlannerUrl(url)).toBeNull();
  });

  it("rejects links that are not https", () => {
    expect(validatePlannerUrl("http://tasks.office.com/plan")).toMatch(/^El enlace de Planner no es válido: .*https/);
    expect(validatePlannerUrl("javascript:alert(1)")).toMatch(/https/);
    expect(validatePlannerUrl("tasks.office.com/plan")).toMatch(/https/);
  });

  it("rejects malformed links", () => {
    expect(validatePlannerUrl("https://")).toMatch(/mal formada/);
    expect(validatePlannerUrl("https://exa mple.com")).toMatch(/mal formada/);
  });

  it("rejects user info in the link", () => {
    expect(validatePlannerUrl("https://user@tasks.office.com/plan")).toMatch(/usuario/);
    expect(validatePlannerUrl("https://user:secret@tasks.office.com/plan")).toMatch(/usuario/);
  });

  it("only allows port 443", () => {
    expect(validatePlannerUrl("https://tasks.office.com:8443/plan")).toMatch(/443/);
    expect(validatePlannerUrl("https://tasks.office.com:443/plan")).toBeNull();
  });

  it("only allows Microsoft hosts and their subdomains", () => {
    expect(validatePlannerUrl("https://example.com/plan")).toMatch(/Microsoft/);
    expect(validatePlannerUrl("https://evil-office.com/plan")).toMatch(/Microsoft/);
    expect(validatePlannerUrl("https://office.com.evil.net/plan")).toMatch(/Microsoft/);
    expect(validatePlannerUrl("https://tasks.office.com@evil.net/plan")).toMatch(/usuario/);
  });

  it("limits the length to 2048 characters", () => {
    const prefix = "https://tasks.office.com/";
    expect(validatePlannerUrl(prefix + "a".repeat(PLANNER_URL_MAX_LENGTH - prefix.length))).toBeNull();
    expect(validatePlannerUrl(prefix + "a".repeat(PLANNER_URL_MAX_LENGTH - prefix.length + 1))).toMatch(/2048/);
  });
});

describe("normalizePlannerUrl", () => {
  it("trims the link and turns blank text into null", () => {
    expect(normalizePlannerUrl("  https://tasks.office.com/plan ")).toBe("https://tasks.office.com/plan");
    expect(normalizePlannerUrl("  ")).toBeNull();
    expect(normalizePlannerUrl(undefined)).toBeNull();
  });
});

describe("openPlannerUrl", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens a valid link in a new tab without opener access", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(openPlannerUrl(" https://tasks.office.com/plan ")).toBe(true);
    expect(openSpy).toHaveBeenCalledWith("https://tasks.office.com/plan", "_blank", "noopener,noreferrer");
  });

  it("does not open a missing or invalid link", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(openPlannerUrl(null)).toBe(false);
    expect(openPlannerUrl("")).toBe(false);
    expect(openPlannerUrl("javascript:alert(1)")).toBe(false);
    expect(openPlannerUrl("https://example.com/plan")).toBe(false);
    expect(openSpy).not.toHaveBeenCalled();
  });
});
