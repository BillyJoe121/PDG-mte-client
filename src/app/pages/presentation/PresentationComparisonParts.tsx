import { Calendar } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { ComparisonCsvRow } from "./presentationExportUtils";
import { PRESENTATION_UI } from "./PresentationLayout";
import { buildComparisonBars, comparisonDifference } from "./PresentationComparisonData";
import { BAR_TRACK, formatScreenCount, LABEL_STYLE, ScreenEmptyState } from "./PresentationScreenParts";

/** Side A is always blue and side B always green, in the pickers, the cards, the bars and the table. */
export const SIDE_COLORS = { A: PRESENTATION_UI.blue, B: PRESENTATION_UI.green } as const;
/** Darker green for text on white, so side B labels keep enough contrast. */
export const SIDE_TEXT = { A: PRESENTATION_UI.blue, B: "#2F855A" } as const;

const PERIOD_CARD_VARIANTS = {
  base: { side: "A", label: "Periodo A (Base)" },
  compare: { side: "B", label: "Periodo B (Comparado)" },
} as const;

/** Header card of one period: which side it is, its dates and its recorded status. The figures live in the table. */
export function PeriodStatsCard({
  variant,
  periodName,
  period,
}: {
  variant: keyof typeof PERIOD_CARD_VARIANTS;
  periodName: string;
  period?: AcademicPeriod;
}) {
  const { side, label } = PERIOD_CARD_VARIANTS[variant];
  return (
    <article
      className="flex min-w-0 flex-col rounded-lg bg-white px-3 py-2"
      style={{ border: `1px solid ${PRESENTATION_UI.border}`, borderTop: `3px solid ${SIDE_COLORS[side]}` }}
    >
      <span className="inline-flex items-center gap-1.5" style={{ ...LABEL_STYLE, color: SIDE_TEXT[side] }}>
        <Calendar size={12} aria-hidden="true" /> {label}
      </span>
      <h3 style={{ fontSize: 14, fontWeight: 900, color: PRESENTATION_UI.text, lineHeight: 1.25, marginTop: 3 }}>Periodo Académico {periodName}</h3>
      <p style={{ fontSize: 11.5, fontWeight: 600, color: PRESENTATION_UI.muted, marginTop: 1 }}>
        {period?.startDate ?? "Sin fecha"} a {period?.endDate ?? "Sin fecha"} · Estado:{" "}
        <strong style={{ color: PRESENTATION_UI.text }}>{period?.status ?? "Sin estado"}</strong>
      </p>
    </article>
  );
}

const DIFFERENCE_COLORS = { up: "#2F855A", down: "#B8461F", same: PRESENTATION_UI.muted } as const;

/**
 * Side-by-side table of recorded values, with the difference B − A for numeric rows.
 * Rows without a numeric value on both sides, such as Estado, show "—".
 */
export function ComparisonTable({ rows, headerA, headerB }: { rows: ComparisonCsvRow[]; headerA: string; headerB: string }) {
  const headStyle = LABEL_STYLE;
  const bars = new Map(buildComparisonBars(rows).map((bar) => [bar.metric, bar]));
  const max = Math.max(1, ...[...bars.values()].flatMap((bar) => [bar.a, bar.b]));
  const formatValue = (value: number | string) => (typeof value === "number" ? formatScreenCount(value) : value);
  return (
    <div className="overflow-x-auto rounded-lg bg-white" style={{ border: `1px solid ${PRESENTATION_UI.border}` }}>
      <table className="w-full text-left" style={{ minWidth: 560, fontSize: 12.5 }} aria-label="Tabla comparativa">
        <thead style={{ backgroundColor: PRESENTATION_UI.surface, borderBottom: `1px solid ${PRESENTATION_UI.border}` }}>
          <tr>
            <th scope="col" className="px-3 py-2" style={headStyle}>Métrica</th>
            <th scope="col" className="px-3 py-2 text-right" style={{ ...headStyle, color: SIDE_TEXT.A }}>{headerA}</th>
            <th scope="col" className="px-3 py-2 text-right" style={{ ...headStyle, color: SIDE_TEXT.B }}>{headerB}</th>
            <th scope="col" className="px-3 py-2 text-right" style={headStyle}>Diferencia (B − A)</th>
            <th scope="col" className="px-3 py-2" style={headStyle}>Distribución</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const difference = comparisonDifference(row);
            const tone = difference.value === null || difference.value === 0 ? "same" : difference.value > 0 ? "up" : "down";
            return (
              <tr key={row.metric} style={{ borderBottom: `1px solid ${PRESENTATION_UI.divider}` }}>
                <th scope="row" className="px-3 py-1.5" style={{ fontWeight: 850, color: PRESENTATION_UI.text }}>{row.metric}</th>
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontSize: 13.5, fontWeight: 900, color: PRESENTATION_UI.text }}>{formatValue(row.valA)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontSize: 13.5, fontWeight: 900, color: PRESENTATION_UI.text }}>{formatValue(row.valB)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ fontSize: 12.5, fontWeight: 900, color: DIFFERENCE_COLORS[tone] }}>
                  <span aria-hidden="true">{difference.text}</span>
                  <span className="sr-only">{difference.label}</span>
                </td>
                <td className="px-3 py-1.5">
                  <SideBars bar={bars.get(row.metric)} max={max} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Two thin bars, A blue over B green, relative to the largest value of the table. Purely visual. */
function SideBars({ bar, max }: { bar?: { a: number; b: number }; max: number }) {
  if (!bar) return null;
  return (
    <span className="flex w-[120px] flex-col gap-0.5" aria-hidden="true">
      {(["a", "b"] as const).map((key) => (
        <span key={key} className="block h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: BAR_TRACK }}>
          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (bar[key] / max) * 100)}%`, backgroundColor: key === "a" ? SIDE_COLORS.A : SIDE_COLORS.B }} />
        </span>
      ))}
    </span>
  );
}

/** Loading, error or empty message shown instead of the comparison. */
export function ComparisonStatusMessage({ title, text, tone = "info" }: { title: string; text: string; tone?: "info" | "error" }) {
  return <ScreenEmptyState title={title} text={text} tone={tone} />;
}
