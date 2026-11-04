import type { CSSProperties } from "react";
import type { ProjectType } from "../../services/projectsApi";
import { COLORS } from "./projectDetailShared";

export const TYPE_LABELS = {
  GRADO: "Proyecto de grado",
  INVESTIGACION: "Investigación",
  EXTENSION: "Extensión",
  MACROPROYECTO: "Macroproyecto",
} as const;

export const PROJECT_TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) as Array<{ value: ProjectType; label: string }>;

export const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

/** Recorded progress uses one color: the value is shown as recorded, never graded. */
export function getProgressColor(_value?: number) {
  return COLORS.blue;
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

export const primaryButtonStyle: CSSProperties = {
  padding: "9px 12px",
  backgroundColor: COLORS.green,
  color: "#fff",
  fontSize: 10.5,
  fontWeight: 900,
};

export const secondaryButtonStyle: CSSProperties = {
  padding: "9px 12px",
  backgroundColor: "#fff",
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  fontSize: 10.5,
  fontWeight: 900,
};

export const selectControlStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 10.5,
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
  fontSize: 11,
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
