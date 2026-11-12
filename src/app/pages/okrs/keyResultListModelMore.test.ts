import { describe, expect, it } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import {
  buildKeyResultsDrilldownUrl,
  filterKeyResults,
  hasKeyResultDrilldown,
  readKeyResultDrilldown,
} from "./keyResultListModel";

function kr(id: number, extra: Partial<KeyResult> = {}): KeyResult {
  return { id, name: `KR ${id}`, status: "ACTIVO", progressPercentage: 0, ...extra } as KeyResult;
}

describe("key result drill-down links", () => {
  it("links to the strategic bet scope and omits the period when none is given", () => {
    const url = buildKeyResultsDrilldownUrl({ scope: "strategicBet", name: "Apuesta digital", status: "ACTIVO" });
    const params = new URL(url, "http://x").searchParams;
    expect(params.get("bet")).toBe("Apuesta digital");
    expect(params.has("period")).toBe(false);
    expect(readKeyResultDrilldown(params).bet).toBe("Apuesta digital");
  });

  it("tells whether any drill-down value is present", () => {
    expect(hasKeyResultDrilldown({})).toBe(false);
    expect(hasKeyResultDrilldown({ period: "2026-1" })).toBe(true);
    expect(hasKeyResultDrilldown({ department: "Ingeniería" })).toBe(true);
    expect(hasKeyResultDrilldown({ goal: "Meta 1" })).toBe(true);
    expect(hasKeyResultDrilldown({ bet: "Apuesta" })).toBe(true);
    expect(hasKeyResultDrilldown(readKeyResultDrilldown(new URLSearchParams("goal=%20%20")))).toBe(false);
  });
});

describe("filtering key results with missing links", () => {
  it("treats a KR without period, goals or bets as not matching a drill-down", () => {
    const bare = [kr(1), kr(2, { academicPeriodName: "2026-1" })];
    expect(filterKeyResults(bare, "", "", { period: "2026-1" }).map((item) => item.id)).toEqual([2]);
    expect(filterKeyResults(bare, "", "", { goal: "Meta 1" })).toEqual([]);
    expect(filterKeyResults(bare, "", "", { bet: "Apuesta" })).toEqual([]);
  });

  it("searches by goal, bet, unit and period names, and by the numeric id", () => {
    const list = [
      kr(1, { goals: [{ id: 1, name: "Graduación oportuna" }], strategicBets: [{ id: 2, name: "Transformación digital" }], measurementUnitName: "Porcentaje", academicPeriodName: "2026-1" }),
      kr(2),
    ];
    expect(filterKeyResults(list, "graduacion", "").map((item) => item.id)).toEqual([1]);
    expect(filterKeyResults(list, "transformacion", "").map((item) => item.id)).toEqual([1]);
    expect(filterKeyResults(list, "porcentaje", "").map((item) => item.id)).toEqual([1]);
    expect(filterKeyResults(list, "2", "").map((item) => item.id)).toContain(2);
    expect(filterKeyResults(list, "inexistente", "")).toEqual([]);
  });
});
