import type React from "react";
import type { Rol } from "../../context/AuthContext";
import type { ContributionType, ProjectStatus } from "../../services/projectsApi";

export const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  purple: "#7C3AED",
  gray: "#717182",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  FINALIZADO: "Finalizado",
  SUSPENDIDO: "Suspendido",
  ARCHIVADO: "Archivado",
};

export const CONTRIBUTION_TYPES: { value: ContributionType; label: string }[] = [
  { value: "DIRECTA", label: "Directa" },
  { value: "INDIRECTA", label: "Indirecta" },
  { value: "SOPORTE", label: "Soporte" },
];

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return "No se pudo completar la accion.";
}

export function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
}

export function statusColor(status: ProjectStatus) {
  if (status === "ACTIVO") return COLORS.green;
  if (status === "FINALIZADO") return COLORS.blue;
  if (status === "SUSPENDIDO") return COLORS.orange;
  if (status === "ARCHIVADO") return "#6B7280";
  return "#374151";
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ width: "100%", height: 8, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", backgroundColor: color }} />
    </div>
  );
}

export function availableStatusTransitions(role: Rol | undefined, current: ProjectStatus): ProjectStatus[] {
  if (role === "administrador") {
    return (Object.keys(STATUS_LABELS) as ProjectStatus[]).filter((status) => status !== current);
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

export function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center rounded" style={{ width: 30, height: 30, backgroundColor: "#F3F4F6", color: COLORS.blue }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 900, color: "#9CA3AF", textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 850, color: "#000", marginTop: 3 }}>{value}</p>
      </div>
    </div>
  );
}

export function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
      <p style={{ fontSize: 11, fontWeight: 900, color: "#9CA3AF", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 950, color: "#000", marginTop: 5 }}>{value}</p>
    </div>
  );
}
