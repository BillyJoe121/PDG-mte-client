import type { ReactNode } from "react";

/** Same tokens the Dashboard uses, so the presentation reads as part of the app. */
export const PRESENTATION_UI = {
  text: "#111827",
  muted: "#717182",
  subtle: "#9CA3AF",
  border: "#D9DEE8",
  divider: "#E5E7EB",
  surface: "#F8FAFC",
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  shadow: "0 1px 2px rgba(17,24,39,0.05)",
} as const;

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  accent?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

/** White band with eyebrow, title and subtitle, as in the Dashboard header. */
export function PresentationPageHeader({ eyebrow, title, subtitle, accent = PRESENTATION_UI.blue, actions, children }: PageHeaderProps) {
  return (
    <div className="bg-white px-4 pb-4 pt-5 sm:px-6" style={{ borderBottom: `1px solid ${PRESENTATION_UI.divider}` }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p style={{ fontSize: 9, fontWeight: 900, color: accent, textTransform: "uppercase" }}>{eyebrow}</p>
          <h1 style={{ fontSize: 17, fontWeight: 900, color: PRESENTATION_UI.text, lineHeight: 1.15, marginTop: 3 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 10.5, color: PRESENTATION_UI.subtle, marginTop: 5 }}>{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Recorded status as a dot and a label, like the status rows of the Dashboard. */
export function PresentationStatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const active = status.toUpperCase() === "ACTIVA";
  const known = active || status.toUpperCase() === "INACTIVA";
  const label = known ? (active ? "Activa" : "Inactiva") : status;
  const color = active ? PRESENTATION_UI.green : PRESENTATION_UI.subtle;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5"
      style={{ fontSize: 10, fontWeight: 850, color: active ? "#2F855A" : PRESENTATION_UI.muted, backgroundColor: active ? "#ECF8F1" : "#F3F4F6" }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

interface PanelProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  actions?: ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
  children?: ReactNode;
}

/** White panel with an icon, title and subtitle, as the Dashboard panels. */
export function PresentationPanel({ title, subtitle, icon, accent = PRESENTATION_UI.blue, actions, className = "", headingLevel = "h2", children }: PanelProps) {
  const Heading = headingLevel;
  return (
    <section className={`rounded-md bg-white p-4 ${className}`} style={{ border: `1px solid ${PRESENTATION_UI.border}`, boxShadow: PRESENTATION_UI.shadow }}>
      <div className={`flex flex-wrap items-start justify-between gap-3 ${children ? "mb-4" : ""}`}>
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${accent}14`, color: accent, border: `1px solid ${accent}26` }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <Heading style={{ fontSize: 13, fontWeight: 900, color: PRESENTATION_UI.text, lineHeight: 1.15 }}>{title}</Heading>
            {subtitle && <p style={{ fontSize: 10.5, color: PRESENTATION_UI.muted, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
