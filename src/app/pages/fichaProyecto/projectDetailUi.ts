import type { CSSProperties } from "react";
import type { ProjectType } from "../../services/projectsApi";
import { COLORS } from "./projectDetailShared";

export const TYPE_LABELS = {
  GRADO: "Proyecto de grado",
  INVESTIGACION: "Investigacion",
  EXTENSION: "Extension",
  MACROPROYECTO: "Macroproyecto",
} as const;

export const PROJECT_TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) as Array<{ value: ProjectType; label: string }>;

export const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function getProgressColor(value: number) {
  if (value >= 70) return COLORS.green;
  if (value >= 40) return COLORS.blue;
  return COLORS.orange;
}

export function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function parseTutors(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const heroEyebrowStyle: CSSProperties = {
  color: "rgba(255,255,255,0.74)",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase",
};

export const heroTitleStyle: CSSProperties = {
  color: "#fff",
  fontSize: 28,
  fontWeight: 950,
  lineHeight: 1.08,
  marginTop: 10,
  maxWidth: 920,
  overflowWrap: "anywhere",
};

export const heroDescriptionStyle: CSSProperties = {
  color: "rgba(255,255,255,0.84)",
  fontSize: 12,
  marginTop: 8,
  lineHeight: 1.45,
  maxWidth: 860,
};

export const primaryButtonStyle: CSSProperties = {
  padding: "9px 12px",
  backgroundColor: COLORS.green,
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};

export const secondaryButtonStyle: CSSProperties = {
  padding: "9px 12px",
  backgroundColor: "#fff",
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  fontSize: 12,
  fontWeight: 900,
};

export const selectControlStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
};

export const modalInputStyle: CSSProperties = {
  width: "100%",
  minHeight: 40,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 13,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  outline: "none",
};

export const modalTextAreaStyle: CSSProperties = {
  ...modalInputStyle,
  resize: "vertical",
  minHeight: 112,
  lineHeight: 1.5,
};
