import type { ReactNode } from "react";
import { Info } from "lucide-react";
import type { KeyResultRanking } from "../../services/reportsApi";
import { boundedPercent, formatPercent } from "./PresentationConsolidatedBuilder";
import { PRESENTATION_UI } from "./PresentationLayout";

/* Building blocks of the slides, sized for the 1920×1080 stage. */

/** Joins the linked Meta and Apuesta names of a KR ranking row. */
export function strategyText(row: Pick<KeyResultRanking, "goalNames" | "strategicBetNames">) {
  const names = [...(row.goalNames ?? []), ...(row.strategicBetNames ?? [])].filter(Boolean);
  return names.length ? names.join(", ") : "Sin Meta ni Apuesta";
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

/** Big recorded figure with its label and an optional note below. */
export function StatTile({ label, value, note, color, icon, size = "md" }: {
  label: string;
  value: number | string;
  note?: string;
  color: string;
  icon?: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <article
      className="flex min-w-0 flex-col justify-between rounded-xl bg-white"
      style={{ border: `2px solid ${PRESENTATION_UI.border}`, borderTop: `8px solid ${color}`, padding: size === "lg" ? "36px 40px" : "28px 32px" }}
    >
      <div className="flex items-start justify-between gap-6">
        <span style={{ fontSize: 24, fontWeight: 900, color: PRESENTATION_UI.muted, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2 }}>
          {label}
        </span>
        {icon && (
          <span className="grid shrink-0 place-items-center rounded-lg" style={{ width: 56, height: 56, backgroundColor: `${color}1A`, color }} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <strong className="block" style={{ fontSize: size === "lg" ? 136 : 96, fontWeight: 900, lineHeight: 1, color: PRESENTATION_UI.text, marginTop: 20 }}>
        {typeof value === "number" ? formatCount(value) : value}
      </strong>
      {note && (
        <p style={{ fontSize: 22, fontWeight: 650, color: PRESENTATION_UI.muted, marginTop: 18, paddingTop: 14, borderTop: `2px solid ${PRESENTATION_UI.border}` }}>
          {note}
        </p>
      )}
    </article>
  );
}

/** Horizontal bar of the progress a responsible person recorded on a KR. */
export function ProgressBarRow({ rank, label, detail, value, color = PRESENTATION_UI.blue }: {
  rank?: number;
  label: string;
  detail?: string;
  value: string | number;
  color?: string;
}) {
  const width = boundedPercent(value);
  return (
    <li className="grid items-center gap-x-8" style={{ gridTemplateColumns: rank === undefined ? "minmax(0,1fr) 140px" : "56px minmax(0,1fr) 140px" }}>
      {rank !== undefined && (
        <span className="grid place-items-center rounded-lg" style={{ width: 56, height: 56, fontSize: 24, fontWeight: 900, backgroundColor: PRESENTATION_UI.surface, border: `2px solid ${PRESENTATION_UI.border}` }}>
          {rank}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-baseline gap-4">
          <p className="truncate" style={{ fontSize: 28, fontWeight: 850, color: PRESENTATION_UI.text }}>{label}</p>
        </div>
        {detail && <p className="truncate" style={{ fontSize: 20, fontWeight: 650, color: PRESENTATION_UI.muted, marginTop: 2 }}>{detail}</p>}
        <div className="overflow-hidden rounded-full" style={{ height: 16, marginTop: 10, backgroundColor: "#E9ECF2" }} aria-hidden="true">
          <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
        </div>
      </div>
      <span className="text-right" style={{ fontSize: 40, fontWeight: 900, color: PRESENTATION_UI.text }}>{formatPercent(value)}</span>
    </li>
  );
}

/** Two recorded counts shown as one split bar with its legend. */
export function SplitBar({ label, parts }: { label: string; parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  return (
    <div>
      <p style={{ fontSize: 22, fontWeight: 900, color: PRESENTATION_UI.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <div className="flex overflow-hidden rounded-full" style={{ height: 28, marginTop: 14, backgroundColor: "#E9ECF2" }} aria-hidden="true">
        {total > 0 && parts.map((part) => (
          <div key={part.label} style={{ width: `${(part.value / total) * 100}%`, backgroundColor: part.color }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-10 gap-y-2" style={{ marginTop: 14 }}>
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-3" style={{ fontSize: 22, fontWeight: 750, color: PRESENTATION_UI.text }}>
            <span className="rounded-sm" style={{ width: 18, height: 18, backgroundColor: part.color }} aria-hidden="true" />
            {part.label}: {formatCount(part.value)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dignified empty state: says what is missing and where to record it. */
export function SlideEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-[1240px] flex-col items-center rounded-2xl text-center"
      style={{ border: "3px dashed #C9CFDB", backgroundColor: PRESENTATION_UI.surface, padding: "64px 80px" }}
    >
      <span className="grid place-items-center rounded-full bg-white" style={{ width: 96, height: 96, color: PRESENTATION_UI.blue, border: `2px solid ${PRESENTATION_UI.border}` }} aria-hidden="true">
        <Info size={48} />
      </span>
      <p style={{ fontSize: 40, fontWeight: 900, color: PRESENTATION_UI.text, marginTop: 32, lineHeight: 1.2 }}>{title}</p>
      <p style={{ fontSize: 26, fontWeight: 600, color: PRESENTATION_UI.muted, marginTop: 16, lineHeight: 1.45, maxWidth: 960 }}>{text}</p>
    </div>
  );
}

/** Small uppercase heading of a panel inside a slide. */
export function PanelHeading({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6" style={{ borderBottom: `2px solid ${PRESENTATION_UI.border}`, paddingBottom: 14, marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: PRESENTATION_UI.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h2>
      {aside && <span style={{ fontSize: 22, fontWeight: 750, color: PRESENTATION_UI.muted }}>{aside}</span>}
    </div>
  );
}
