import {
  Archive,
  CheckCircle2,
  CheckSquare,
  FileText,
  PauseCircle,
} from "lucide-react";
import type React from "react";
import type { Rol } from "../../context/AuthContext";
import type { ContributionType, ProjectStatus, ProjectType } from "../../services/projectsApi";

export const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  purple: "#7C3AED",
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

export function statusBadge(status: ProjectStatus) {
  const map: Record<ProjectStatus, { bg: string; color: string; icon: React.ReactNode }> = {
    BORRADOR: { bg: "#F9FAFB", color: "#374151", icon: <FileText size={11} /> },
    ACTIVO: { bg: "#ECFDF5", color: "#065F46", icon: <CheckCircle2 size={11} /> },
    FINALIZADO: { bg: "#EEF2FF", color: "#3730A3", icon: <CheckSquare size={11} /> },
    SUSPENDIDO: { bg: "#FEF3F2", color: "#991B1B", icon: <PauseCircle size={11} /> },
    ARCHIVADO: { bg: "#F3F4F6", color: "#6B7280", icon: <Archive size={11} /> },
  };
  const item = map[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: item.bg, color: item.color, fontSize: 11, fontWeight: 800 }}>
      {item.icon}
      {statusLabel(status)}
    </span>
  );
}

export function typeBadge(type: ProjectType) {
  const colors: Record<ProjectType, string> = {
    GRADO: COLORS.blue,
    INVESTIGACION: COLORS.green,
    EXTENSION: COLORS.orange,
    MACROPROYECTO: COLORS.purple,
  };
  return (
    <span className="inline-flex px-2 py-1 rounded" style={{ backgroundColor: `${colors[type]}18`, color: colors[type], fontSize: 11, fontWeight: 800 }}>
      {typeLabel(type)}
    </span>
  );
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return "No se pudo completar la accion.";
}

export function availableStatusTransitions(role: Rol | undefined, current: ProjectStatus): ProjectStatus[] {
  if (role === "administrador") {
    return STATUS_OPTIONS
      .map((option) => option.value)
      .filter((value): value is ProjectStatus => value !== "todos" && value !== current);
  }
  if (role !== "director") return [];
  const transitions: Record<ProjectStatus, ProjectStatus[]> = {
    BORRADOR: ["ACTIVO", "SUSPENDIDO", "ARCHIVADO"],
    ACTIVO: ["FINALIZADO", "SUSPENDIDO", "ARCHIVADO"],
    SUSPENDIDO: ["ACTIVO", "ARCHIVADO"],
    FINALIZADO: ["ARCHIVADO"],
    ARCHIVADO: [],
  };
  return transitions[current];
}
