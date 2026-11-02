import type { ContributionType, ProjectStatus, ProjectType } from "../../services/projectsApi";

export const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  purple: "#7C3AED",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

export const STATUS_OPTIONS: { value: ProjectStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "ACTIVO", label: "Activo" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "SUSPENDIDO", label: "Suspendido" },
  { value: "ARCHIVADO", label: "Archivado" },
];

export const TYPE_OPTIONS: { value: ProjectType | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los tipos" },
  { value: "GRADO", label: "Proyecto de grado" },
  { value: "INVESTIGACION", label: "Investigacion" },
  { value: "EXTENSION", label: "Extension" },
  { value: "MACROPROYECTO", label: "Macroproyecto" },
];

export const CONTRIBUTION_OPTIONS: { value: ContributionType; label: string }[] = [
  { value: "DIRECTA", label: "Directa" },
  { value: "INDIRECTA", label: "Indirecta" },
  { value: "SOPORTE", label: "Soporte" },
];

export function statusLabel(status: ProjectStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function typeLabel(type: ProjectType) {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return "No se pudo completar la accion.";
}
