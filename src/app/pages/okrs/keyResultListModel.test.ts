import { describe, expect, it } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import { countKeyResultsByStatus, filterKeyResults, parseKeyResultStatusFilter } from "./keyResultListModel";

function kr(id: number, name: string, status: KeyResult["status"] | undefined, progressPercentage = 0): KeyResult {
  return { id, name, status, progressPercentage } as KeyResult;
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
});
