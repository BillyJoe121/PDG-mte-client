import type { ReactNode } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ConsistencyFinding, ConsistencyModule, ConsistencySeverity } from "../../services/consistencyApi";

export const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

export const DEFAULT_STALE_DAYS = 15;
export const consistencyModules: ConsistencyModule[] = ["INDICADORES", "OKRS", "PROYECTOS"];

export const severityMeta: Record<ConsistencySeverity, {
  bg: string;
  color: string;
  label: string;
  solid: string;
  icon: ReactNode;
}> = {
  ALTA: { bg: COLORS.orange, color: "#FFFFFF", label: "Alta", solid: COLORS.orange, icon: <AlertTriangle size={12} /> },
  MEDIA: { bg: COLORS.orange, color: "#FFFFFF", label: "Media", solid: COLORS.orange, icon: <ShieldAlert size={12} /> },
  BAJA: { bg: COLORS.blue, color: "#FFFFFF", label: "Baja", solid: COLORS.blue, icon: <ShieldCheck size={12} /> },
};

export const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function getModuleLabel(modulo: string) {
  if (modulo === "INDICADORES") return "Key Results";
  if (modulo === "PROYECTOS") return "Iniciativas";
  if (modulo === "OKRS") return "OKRs";
  return modulo;
}

export function buildModuleStats(issues: ConsistencyFinding[]) {
  const counts = new Map<string, number>();
  issues.forEach((issue) => counts.set(issue.module, (counts.get(issue.module) ?? 0) + 1));
  return [...counts.entries()]
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count);
}
