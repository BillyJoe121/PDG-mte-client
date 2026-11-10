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
