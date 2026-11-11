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
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  accent?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

/** Compact white band with an optional eyebrow, the title and a one-line subtitle, as in the Dashboard. */
export function PresentationPageHeader({ eyebrow, title, subtitle, accent = PRESENTATION_UI.blue, actions, children }: PageHeaderProps) {
  return (
    <div className="bg-white px-4 py-3 sm:px-5" style={{ borderBottom: `1px solid ${PRESENTATION_UI.border}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="flex items-center gap-1.5" style={{ fontSize: 10.5, fontWeight: 900, color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
              {eyebrow}
            </p>
          )}
          <h1 style={{ fontSize: 19, fontWeight: 700, color: PRESENTATION_UI.text, lineHeight: 1.2, marginTop: eyebrow ? 2 : 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 12, fontWeight: 400, color: PRESENTATION_UI.muted, marginTop: 4, lineHeight: 1.4, maxWidth: 820 }}>{subtitle}</p>}
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
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px"
      style={{ fontSize: 11, fontWeight: 600, color: active ? "#2F855A" : PRESENTATION_UI.muted, backgroundColor: active ? "#ECF8F1" : "#F3F4F6" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
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

/** White panel with a thin border and an uppercase heading, like the panels of the Dashboard. */
export function PresentationPanel({ title, subtitle, icon, accent = PRESENTATION_UI.blue, actions, className = "", headingLevel = "h2", children }: PanelProps) {
  const Heading = headingLevel;
  return (
    <section className={`rounded-lg bg-white p-3 sm:p-4 ${className}`} style={{ border: `1px solid ${PRESENTATION_UI.border}` }}>
      <div
        className={`flex flex-wrap items-center justify-between gap-2 ${children ? "mb-2.5 pb-2" : ""}`}
        style={children ? { borderBottom: `1px solid ${PRESENTATION_UI.border}` } : undefined}
      >
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${accent}1A`, color: accent }}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <Heading style={{ fontSize: 12, fontWeight: 700, color: PRESENTATION_UI.text, lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {title}
            </Heading>
            {subtitle && <p style={{ fontSize: 11.5, fontWeight: 400, color: PRESENTATION_UI.muted, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
