import type { ConsistencyFinding, ConsistencyModule, ConsistencySeverity } from "../../services/consistencyApi";

export const DEFAULT_STALE_DAYS = 15;
export const consistencyModules: ConsistencyModule[] = ["INDICADORES", "OKRS", "PROYECTOS"];

export const severityMeta: Record<ConsistencySeverity, { label: string; tone: "strong" | "neutral" | "outline" }> = {
  ALTA: { label: "Alta", tone: "strong" },
  MEDIA: { label: "Media", tone: "neutral" },
  BAJA: { label: "Baja", tone: "outline" },
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
