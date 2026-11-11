import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { PRESENTATION_UI } from "./PresentationLayout";

/* Screen building blocks for Resumen, Informe and Comparar, in the compact scale of the Dashboard. */

export const LABEL_STYLE = {
  fontSize: 10.5,
  fontWeight: 700,
  color: PRESENTATION_UI.muted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  lineHeight: 1.25,
} as const;

export const BAR_TRACK = "#E9ECF2";

export function formatScreenCount(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

/** Recorded figure with a colored top border, its label and an optional note. */
export function ScreenStatTile({ label, value, note, color, icon, eyebrow, children }: {
  label: string;
  value: number | string;
  note?: ReactNode;
  color: string;
  icon?: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article
      className="flex min-w-0 flex-col rounded-lg bg-white px-3 py-2.5"
      style={{ border: `1px solid ${PRESENTATION_UI.border}`, borderTop: `3px solid ${color}` }}
    >
      {eyebrow}
      <div className="flex items-center justify-between gap-2">
        <span style={LABEL_STYLE}>{label}</span>
        {icon && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ backgroundColor: `${color}1A`, color }} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <strong className="block" style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: PRESENTATION_UI.text, marginTop: 4 }}>
        {typeof value === "number" ? formatScreenCount(value) : value}
      </strong>
      {note && <p style={{ fontSize: 11, fontWeight: 650, color: PRESENTATION_UI.muted, marginTop: 2, lineHeight: 1.35 }}>{note}</p>}
      {children}
    </article>
  );
}

/** Uppercase section heading with a thin rule and an optional count or action on the right. */
export function ScreenSectionHeading({ title, aside, id, level = "h2" }: { title: string; aside?: ReactNode; id?: string; level?: "h2" | "h3" }) {
  const Heading = level;
  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 pb-1.5" style={{ borderBottom: `1px solid ${PRESENTATION_UI.border}` }}>
      <Heading id={id} style={{ fontSize: 11, fontWeight: 700, color: PRESENTATION_UI.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </Heading>
      {aside && <span style={{ fontSize: 11, fontWeight: 600, color: PRESENTATION_UI.muted }}>{aside}</span>}
    </div>
  );
}

/** Dashed empty state: says what is missing and where to record it. */
export function ScreenEmptyState({ title, text, tone = "info" }: { title: string; text: string; tone?: "info" | "error" }) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className="flex flex-col items-center rounded-lg px-4 py-5 text-center"
      style={{ border: `1px dashed ${isError ? "#F2A7A7" : "#C9CFDB"}`, backgroundColor: isError ? "#FEF2F2" : PRESENTATION_UI.surface }}
    >
      <span
        className="grid h-8 w-8 place-items-center rounded-full bg-white"
        style={{ color: isError ? "#B42318" : PRESENTATION_UI.blue, border: `1px solid ${PRESENTATION_UI.border}` }}
        aria-hidden="true"
      >
        <Info size={16} />
      </span>
      <p style={{ fontSize: 13, fontWeight: 900, color: isError ? "#7A1C1C" : PRESENTATION_UI.text, marginTop: 8, lineHeight: 1.25 }}>{title}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: PRESENTATION_UI.muted, marginTop: 3, lineHeight: 1.4, maxWidth: 520 }}>{text}</p>
    </div>
  );
}

export interface BarSeries {
  label: string;
  value: number;
  color: string;
}

/** Legend of colored squares for a group of bars. */
export function BarLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-hidden="true">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5" style={{ fontSize: 10.5, fontWeight: 600, color: PRESENTATION_UI.muted }}>
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Thin stacked bar: each segment is one recorded count, relative to `total`.
 * Purely visual; the numbers stay in their own table cells.
 */
export function StackedBar({ segments, total, width = 120 }: { segments: BarSeries[]; total: number; width?: number }) {
  return (
    <span className="flex h-1.5 overflow-hidden rounded-full" style={{ width, backgroundColor: BAR_TRACK }} aria-hidden="true">
      {segments.map((segment) =>
        segment.value > 0 && total > 0 ? (
          <span key={segment.label} className="block h-full" style={{ width: `${Math.min(100, (segment.value / total) * 100)}%`, backgroundColor: segment.color }} />
        ) : null,
      )}
    </span>
  );
}

/** Small pill with the period, as in the stage header of Presentar. */
export function PeriodPill({ children, color = PRESENTATION_UI.text }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
      style={{ border: `1px solid ${PRESENTATION_UI.border}`, backgroundColor: PRESENTATION_UI.surface, fontSize: 11, fontWeight: 850, color }}
    >
      {children}
    </span>
  );
}
