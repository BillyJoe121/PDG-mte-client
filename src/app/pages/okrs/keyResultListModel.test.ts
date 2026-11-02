import { describe, expect, it } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import {
  buildKeyResultsDrilldownUrl,
  countKeyResultsByStatus,
  filterKeyResults,
  parseKeyResultStatusFilter,
  readKeyResultDrilldown,
} from "./keyResultListModel";

function kr(id: number, name: string, status: KeyResult["status"] | undefined, progressPercentage = 0, extra: Partial<KeyResult> = {}): KeyResult {
  return { id, name, status, progressPercentage, ...extra } as KeyResult;
}

const items = [
  kr(1, "Retención estudiantil", "ACTIVO", 40),
  kr(2, "Graduación oportuna", "CERRADO", 100),
  kr(3, "Movilidad", "BORRADOR"),
  kr(4, "Investigación aplicada", undefined, 10),
];

describe("key result list model", () => {
  it("counts listed key results by recorded status", () => {
    expect(countKeyResultsByStatus(items)).toEqual({ total: 4, BORRADOR: 1, ACTIVO: 2, CERRADO: 1 });
    expect(countKeyResultsByStatus([])).toEqual({ total: 0, BORRADOR: 0, ACTIVO: 0, CERRADO: 0 });
  });

  it("filters by status and by accent-insensitive search", () => {
    expect(filterKeyResults(items, "", "CERRADO").map((item) => item.id)).toEqual([2]);
    expect(filterKeyResults(items, "retencion", "").map((item) => item.id)).toEqual([1]);
    expect(filterKeyResults(items, "investigacion", "ACTIVO").map((item) => item.id)).toEqual([4]);
  });

  it("does not filter by recorded percentage", () => {
    expect(filterKeyResults(items, "", "").length).toBe(4);
  });

  it("accepts only known status filters from the URL", () => {
    expect(parseKeyResultStatusFilter("ACTIVO")).toBe("ACTIVO");
    expect(parseKeyResultStatusFilter("completado")).toBe("");
    expect(parseKeyResultStatusFilter(null)).toBe("");
  });

  it("matches KR codes against the numeric id exactly", () => {
    const many = [kr(5, "Cinco", "ACTIVO"), kr(15, "Quince", "ACTIVO"), kr(50, "Cincuenta", "ACTIVO")];
    ["KR-05", "kr5", "KR 5", " kr-005 "].forEach((query) => {
      expect(filterKeyResults(many, query, "").map((item) => item.id)).toEqual([5]);
    });
    expect(filterKeyResults(many, "KR-9", "")).toEqual([]);
  });

  it("matches goal names exactly when drilling down, so Meta 1 does not include Meta 10", () => {
    const goals = [
      kr(1, "A", "ACTIVO", 0, { goals: [{ id: 1, name: "Meta 1" }] }),
      kr(2, "B", "ACTIVO", 0, { goals: [{ id: 2, name: "Meta 10" }] }),
    ];
    expect(filterKeyResults(goals, "", "", { goal: "meta 1" }).map((item) => item.id)).toEqual([1]);
  });

  it("filters by academic period and strategic bet from drill-down links", () => {
    const scoped = [
      kr(1, "A", "ACTIVO", 0, { academicPeriodName: "2026-1", strategicBets: [{ id: 7, name: "Apuesta digital" }] }),
      kr(2, "B", "ACTIVO", 0, { academicPeriodName: "2026-2", strategicBets: [{ id: 7, name: "Apuesta digital" }] }),
    ];
    expect(filterKeyResults(scoped, "", "", { period: "2026-1", bet: "Apuesta Digital" }).map((item) => item.id)).toEqual([1]);
  });

  it("builds and reads dashboard drill-down links with period and scope", () => {
    const url = buildKeyResultsDrilldownUrl({ scope: "goal", name: "Meta 1", status: "ACTIVO", period: "2026-1" });
    expect(readKeyResultDrilldown(new URL(url, "http://x").searchParams)).toEqual({ period: "2026-1", department: undefined, goal: "Meta 1", bet: undefined });
    const department = buildKeyResultsDrilldownUrl({ scope: "department", name: "Ingeniería", status: "CERRADO", period: "2026-2" });
    expect(readKeyResultDrilldown(new URL(department, "http://x").searchParams)).toEqual({ period: "2026-2", department: "Ingeniería", goal: undefined, bet: undefined });
  });

  it("does not filter by department because key results have no department data", () => {
    const list = [kr(1, "A", "ACTIVO", 0), kr(2, "B", "ACTIVO", 0)];
    expect(filterKeyResults(list, "", "", { department: "Ingeniería" })).toHaveLength(2);
  });
});
