import type { ProjectResponse } from "../../services/projectsApi";
import { COLORS } from "./proyectosShared";

export function buildProjectStats(projects: ProjectResponse[]) {
  return {
    activos: projects.filter((project) => project.status === "ACTIVO").length,
    finalizados: projects.filter((project) => project.status === "FINALIZADO").length,
    krs: new Set(projects.flatMap((project) => project.linkedKeyResults.map((link) => link.keyResultId))).size,
    total: projects.length,
  };
}

export function ProjectStats({ stats }: { stats: ReturnType<typeof buildProjectStats> }) {
  return (
    <div className="flex items-center gap-6 mb-5 flex-wrap">
      {[
        { label: "Activos", value: stats.activos, color: COLORS.green },
        { label: "Finalizados", value: stats.finalizados, color: COLORS.blue },
        { label: "KRs vinculados", value: stats.krs, color: COLORS.purple },
        { label: "Total filtrado", value: stats.total, color: "#000" },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span style={{ fontSize: 22, fontWeight: 950, color: item.color }}>{item.value}</span>
          <span style={{ fontSize: 12, color: "#717182" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
