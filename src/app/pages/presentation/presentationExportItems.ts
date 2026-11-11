import type { PresentationSlide } from "../../services/reportsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { ExportMenuItem } from "./PresentationExportMenu";
import type { PresentationMode } from "./PresentationTypes";
import {
  buildConsolidatedCsvRows,
  exportBetsSummaryCsv,
  exportConsolidatedCsv,
  exportComparisonCsv,
  exportGeneralReportCsv,
  exportGoalsSummaryCsv,
  exportSlideDeckCsv,
  printPresentationView,
} from "./presentationExportUtils";

/** What the comparison view currently shows; null CSV data while there is nothing to compare. */
export interface ComparisonExportSnapshot {
  pdfSubtitle: string;
  csv: Parameters<typeof exportComparisonCsv>[0] | null;
}

interface ExportContext {
  mode: PresentationMode;
  periodName: string;
  bets: StrategicBet[];
  goals: Goal[];
  slides: PresentationSlide[];
  currentIndex: number;
  comparison: ComparisonExportSnapshot | null;
}

/** Entries of the Exportar menu for the view on screen (Informe, Comparar or Presentar): its PDF and the CSV of its own data. */
export function buildExportItems(context: ExportContext): ExportMenuItem[] {
  const { mode, periodName, bets, goals, slides, currentIndex, comparison } = context;
  const subtitle = `Periodo ${periodName} - Modulo de Trazabilidad Estratégica`;

  if (mode === "general") {
    return [
      {
        id: "pdf",
        kind: "pdf",
        label: "PDF del informe",
        onSelect: () =>
          printPresentationView("Informe General de Metas y Apuestas", {
            subtitle,
            printableSelector: ".presentation-general-print-area",
          }),
      },
      { id: "csv", kind: "csv", label: "CSV del informe", onSelect: () => exportGeneralReportCsv(bets, goals, periodName) },
      {
        id: "csv-bets",
        kind: "csv",
        label: "CSV de apuestas",
        disabled: bets.length === 0,
        onSelect: () => exportBetsSummaryCsv(bets, periodName),
      },
      {
        id: "csv-goals",
        kind: "csv",
        label: "CSV de metas",
        disabled: goals.length === 0,
        onSelect: () => exportGoalsSummaryCsv(goals, periodName),
      },
    ];
  }

  if (mode === "compare") {
    const csv = comparison?.csv ?? null;
    return [
      {
        id: "pdf",
        kind: "pdf",
        label: "PDF de la comparativa",
        onSelect: () =>
          printPresentationView("Comparativa de registros", {
            subtitle: comparison?.pdfSubtitle ?? subtitle,
            printableSelector: ".presentation-comparison-print-area",
          }),
      },
      {
        id: "csv",
        kind: "csv",
        label: "CSV de la comparativa",
        disabled: !csv,
        onSelect: () => {
          if (csv) exportComparisonCsv(csv);
        },
      },
    ];
  }

  return [
    {
      id: "pdf",
      kind: "pdf",
      label: "PDF de la diapositiva actual",
      disabled: slides.length === 0,
      onSelect: () =>
        printPresentationView(slides[currentIndex]?.title || "Presentación Institucional", {
          subtitle: `Periodo ${periodName} - Diapositiva ${currentIndex + 1} de ${slides.length}`,
          printableSelector: ".presentation-slide-print-area",
        }),
    },
    {
      id: "csv",
      kind: "csv",
      label: "CSV de las diapositivas",
      disabled: slides.length === 0,
      onSelect: () => exportSlideDeckCsv(slides, periodName),
    },
    {
      id: "csv-consolidated",
      kind: "csv",
      label: "CSV de departamentos y avance de KRs",
      disabled: buildConsolidatedCsvRows(slides).length === 0,
      onSelect: () => exportConsolidatedCsv(slides, periodName),
    },
  ];
}
