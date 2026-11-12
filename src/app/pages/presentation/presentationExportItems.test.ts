import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PresentationSlide } from "../../services/reportsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { buildExportItems } from "./presentationExportItems";
import * as utils from "./presentationExportUtils";

vi.mock("./presentationExportUtils", () => ({
  buildConsolidatedCsvRows: vi.fn(),
  exportBetsSummaryCsv: vi.fn(),
  exportConsolidatedCsv: vi.fn(),
  exportComparisonCsv: vi.fn(),
  exportGeneralReportCsv: vi.fn(),
  exportGoalsSummaryCsv: vi.fn(),
  exportSlideDeckCsv: vi.fn(),
  printPresentationView: vi.fn(),
}));

const bets = [{ id: 1 }] as StrategicBet[];
const goals = [{ id: 2 }] as Goal[];
const slides = [
  { order: 1, type: "COVER", title: "Portada", subtitle: "", content: {} },
  { order: 2, type: "CLOSING", title: "", subtitle: "", content: {} },
] as PresentationSlide[];

const base = { periodName: "2026-1", bets, goals, slides, currentIndex: 0, comparison: null };
const byId = (items: ReturnType<typeof buildExportItems>, id: string) => items.find((item) => item.id === id)!;

describe("buildExportItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(utils.buildConsolidatedCsvRows).mockReturnValue([{}] as never);
  });

  it("offers the report PDF and the three CSVs in the general view", () => {
    const items = buildExportItems({ ...base, mode: "general" });
    expect(items.map((item) => item.id)).toEqual(["pdf", "csv", "csv-bets", "csv-goals"]);

    byId(items, "pdf").onSelect();
    expect(utils.printPresentationView).toHaveBeenCalledWith("Informe General de Metas y Apuestas", expect.objectContaining({ printableSelector: ".presentation-general-print-area" }));
    byId(items, "csv").onSelect();
    expect(utils.exportGeneralReportCsv).toHaveBeenCalledWith(bets, goals, "2026-1");
    byId(items, "csv-bets").onSelect();
    expect(utils.exportBetsSummaryCsv).toHaveBeenCalledWith(bets, "2026-1");
    byId(items, "csv-goals").onSelect();
    expect(utils.exportGoalsSummaryCsv).toHaveBeenCalledWith(goals, "2026-1");
    expect(byId(items, "csv-bets").disabled).toBe(false);
  });

  it("disables the bet and goal CSVs when there are none", () => {
    const items = buildExportItems({ ...base, bets: [], goals: [], mode: "general" });
    expect(byId(items, "csv-bets").disabled).toBe(true);
    expect(byId(items, "csv-goals").disabled).toBe(true);
  });

  it("exports the comparison with its own subtitle and data", () => {
    const csv = { rows: [] } as never;
    const items = buildExportItems({ ...base, mode: "compare", comparison: { pdfSubtitle: "A vs B", csv } });
    byId(items, "pdf").onSelect();
    expect(utils.printPresentationView).toHaveBeenCalledWith("Comparativa de registros", expect.objectContaining({ subtitle: "A vs B" }));
    expect(byId(items, "csv").disabled).toBe(false);
    byId(items, "csv").onSelect();
    expect(utils.exportComparisonCsv).toHaveBeenCalledWith(csv);
  });

  it("falls back to the period subtitle and disables the CSV without comparison data", () => {
    const items = buildExportItems({ ...base, mode: "compare" });
    byId(items, "pdf").onSelect();
    expect(utils.printPresentationView).toHaveBeenCalledWith("Comparativa de registros", expect.objectContaining({ subtitle: expect.stringContaining("Periodo 2026-1") }));
    expect(byId(items, "csv").disabled).toBe(true);
    byId(items, "csv").onSelect();
    expect(utils.exportComparisonCsv).not.toHaveBeenCalled();

    const withoutCsv = buildExportItems({ ...base, mode: "compare", comparison: { pdfSubtitle: "x", csv: null } });
    expect(byId(withoutCsv, "csv").disabled).toBe(true);
  });

  it("exports the current slide and the slide deck CSVs in the slides view", () => {
    const items = buildExportItems({ ...base, mode: "slides", currentIndex: 0 });
    byId(items, "pdf").onSelect();
    expect(utils.printPresentationView).toHaveBeenLastCalledWith("Portada", expect.objectContaining({ subtitle: "Periodo 2026-1 - Diapositiva 1 de 2" }));
    byId(items, "csv").onSelect();
    expect(utils.exportSlideDeckCsv).toHaveBeenCalledWith(slides, "2026-1");
    byId(items, "csv-consolidated").onSelect();
    expect(utils.exportConsolidatedCsv).toHaveBeenCalledWith(slides, "2026-1");

    buildExportItems({ ...base, mode: "slides", currentIndex: 1 })[0].onSelect();
    expect(utils.printPresentationView).toHaveBeenLastCalledWith("Presentación Institucional", expect.anything());
  });

  it("disables slide exports when there are no slides or consolidated rows", () => {
    vi.mocked(utils.buildConsolidatedCsvRows).mockReturnValue([]);
    const items = buildExportItems({ ...base, mode: "slides", slides: [] });
    expect(items.every((item) => item.disabled)).toBe(true);
    items[0].onSelect();
    expect(utils.printPresentationView).toHaveBeenCalledWith("Presentación Institucional", expect.anything());
  });
});
