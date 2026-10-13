import type { ReactNode } from "react";
import { CheckCircle2, FolderKanban, Gauge, Target } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { CountByStatus, DashboardSummary, ProgressBucket, ProgressBucketCount } from "../../services/dashboardApi";
import { DashboardEmptyState as EmptyState } from "./DashboardCoverage";
import { COLORS, shortMotionTransition } from "./dashboardTheme";

const projectStatusLabel: Record<CountByStatus["status"], string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  FINALIZADO: "Finalizado",
  SUSPENDIDO: "Suspendido",
  ARCHIVADO: "Archivado",
};

const projectStatusColor: Record<CountByStatus["status"], string> = {
  BORRADOR: COLORS.gray,
  ACTIVO: COLORS.blue,
  FINALIZADO: COLORS.green,
  SUSPENDIDO: COLORS.orange,
  ARCHIVADO: COLORS.text,
};

const bucketLabel: Record<ProgressBucket, string> = {
  COMPLETED: "Completados",
  ON_TRACK: "En ruta",
  AT_RISK: "En riesgo",
  LOW: "Bajo",
};

const bucketColor: Record<ProgressBucket, string> = {
  COMPLETED: COLORS.green,
  ON_TRACK: COLORS.blue,
  AT_RISK: COLORS.orange,
  LOW: COLORS.red,
};

export function sumCounts<T extends { count: number }>(items: T[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

export function buildKpis(summary: DashboardSummary, totalProjects: number) {
  return [
    {
      label: "Iniciativas activas",
      value: summary.activeProjects,
      sub: `${summary.completedProjects} finalizadas de ${totalProjects || 0} totales`,
      icon: FolderKanban,
      color: COLORS.green,
    },
    {
      label: "KRs en seguimiento",
      value: summary.keyResultsInFollowUp,
      sub: `${summary.lowCompletionKeyResults} requieren atencion`,
      icon: Target,
      color: COLORS.orange,
    },
    {
      label: "KRs operativos",
      value: summary.completedKeyResults + summary.inProgressKeyResults,
      sub: `${summary.completedKeyResults} completados, ${summary.inProgressKeyResults} en progreso`,
      icon: CheckCircle2,
      color: COLORS.orange,
    },
    {
      label: "KRs completados",
      value: summary.completedKeyResults,
      sub: `${summary.keyResultsAbove50} con mas del 50%, ${summary.keyResultsBetween0And50} entre 0 y 50%, ${summary.keyResultsAtZero} en 0%`,
      icon: Gauge,
      color: COLORS.blue,
    },
  ];
}

export type DashboardKpi = ReturnType<typeof buildKpis>[number];

export function DashboardKpiGrid({ kpis }: { kpis: DashboardKpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, index) => (
        <MetricCard key={kpi.label} index={index} {...kpi} />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  index,
}: DashboardKpi & { index: number }) {
  const reduceMotion = useReducedMotion();
  const solid = true;

  return (
    <motion.div
      className="rounded-md bg-white p-4"
      style={{
        backgroundColor: solid ? color : "#fff",
        border: `1px solid ${solid ? color : COLORS.border}`,
        boxShadow: solid ? `0 14px 30px ${color}2E` : "0 1px 2px rgba(17,24,39,0.06)",
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...shortMotionTransition, delay: Math.min(index * 0.025, 0.1) }}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: solid ? "rgba(255,255,255,0.16)" : `${color}18`, border: `1px solid ${solid ? "rgba(255,255,255,0.32)" : `${color}26`}` }}>
          <Icon size={19} color={solid ? "#fff" : color} />
        </div>
        <span style={{ width: 34, height: 5, borderRadius: 99, backgroundColor: solid ? "rgba(255,255,255,0.72)" : color, opacity: 0.86 }} />
      </div>
      <p style={{ fontSize: 25, fontWeight: 900, color: solid ? "#fff" : color, lineHeight: 1.05, marginTop: 14 }}>{value}</p>
      <p style={{ fontSize: 11, fontWeight: 850, color: solid ? "#fff" : COLORS.text, marginTop: 5 }}>{label}</p>
      <p style={{ fontSize: 11, color: solid ? "rgba(255,255,255,0.82)" : COLORS.gray, marginTop: 3, lineHeight: 1.35 }}>{sub}</p>
    </motion.div>
  );
}

export function DashboardPanel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, border: "1px solid #DDE3FF" }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.text, lineHeight: 1.15 }}>{title}</h2>
          <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProjectStatusDistribution({ data }: { data: CountByStatus[] }) {
  const total = sumCounts(data);
  if (!total) return <EmptyState text="Sin iniciativas para el periodo seleccionado." compact />;

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-[#EEF2F7]">
        {data.filter((item) => item.count > 0).map((item) => (
          <div
            key={item.status}
            title={`${projectStatusLabel[item.status]} ${item.count}`}
            style={{ width: `${(item.count / total) * 100}%`, backgroundColor: projectStatusColor[item.status] }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.map((item) => (
          <DistributionRow
            key={item.status}
            color={projectStatusColor[item.status]}
            label={projectStatusLabel[item.status]}
            total={total}
            value={item.count}
          />
        ))}
      </div>
    </div>
  );
}

export function KeyResultsProgress({ data }: { data: ProgressBucketCount[] }) {
  const total = sumCounts(data);
  if (!total) return <EmptyState text="Sin Key Results para el periodo seleccionado." compact />;

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <DistributionRow
          key={item.bucket}
          color={bucketColor[item.bucket]}
          label={bucketLabel[item.bucket]}
          total={total}
          value={item.count}
        />
      ))}
    </div>
  );
}

function DistributionRow({ color, label, total, value }: { color: string; label: string; total: number; value: number }) {
  const width = total ? (value / total) * 100 : 0;
  return (
    <div className="rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span style={{ fontSize: 12, fontWeight: 850, color: COLORS.text }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 900, color }}>{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
        <div style={{ width: `${width}%`, height: "100%", backgroundColor: color }} />
      </div>
    </div>
  );
}
