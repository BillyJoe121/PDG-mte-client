import type { ProjectResponse } from "../../services/projectsApi";
import { motion, useReducedMotion } from "motion/react";
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
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: "Activos", value: stats.activos, color: COLORS.green },
        { label: "Finalizados", value: stats.finalizados, color: COLORS.blue },
        { label: "KRs vinculados", value: stats.krs, color: COLORS.purple },
        { label: "Total filtrado", value: stats.total, color: COLORS.text },
      ].map((item, index) => (
        <motion.div
          key={item.label}
          className="bg-white rounded-md p-4"
          style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.1) }}
          whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
        >
          <p style={{ fontSize: "24px", fontWeight: 800, color: item.color }}>{item.value}</p>
          <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 2, fontWeight: 700 }}>{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
