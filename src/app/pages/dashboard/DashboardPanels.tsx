import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { CountByStatus, DashboardSummary, KeyResultCountByStatus } from "../../services/dashboardApi";
import { KEY_RESULT_STATUS_ORDER, keyResultStatusColor, keyResultStatusLabel } from "./keyResultStatusMeta";
import { DashboardEmptyState as EmptyState } from "./DashboardCoverage";
import { COLORS, shortMotionTransition } from "./dashboardTheme";

const PROJECT_STATUS_ORDER: CountByStatus["status"][] = ["BORRADOR", "ACTIVO", "FINALIZADO", "SUSPENDIDO", "ARCHIVADO"];

const projectStatusLabel: Record<CountByStatus["status"], string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activas",
  FINALIZADO: "Finalizadas",
  SUSPENDIDO: "Suspendidas",
  ARCHIVADO: "Archivadas",
};

const projectStatusColor: Record<CountByStatus["status"], string> = {
  BORRADOR: COLORS.gray,
  ACTIVO: COLORS.blue,
  FINALIZADO: COLORS.green,
  SUSPENDIDO: COLORS.orange,
  ARCHIVADO: "#374151",
};

export function sumCounts<T extends { count: number }>(items: T[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

/** Headline counters, taken from the recorded status counts only. */
export function buildKpis(summary: DashboardSummary, totalProjects: number) {
  return [
    { label: "Iniciativas", value: totalProjects },
    { label: "Iniciativas activas", value: summary.activeProjects },
    { label: "Iniciativas finalizadas", value: summary.completedProjects },
    { label: "KRs en seguimiento", value: summary.keyResultsInFollowUp },
    { label: "KRs activos", value: summary.activeKeyResults },
    { label: "KRs cerrados", value: summary.closedKeyResults },
  ];
}

export interface MetricCardProps {
  label: string;
  value: number | string;
  sub: string;
  icon: LucideIcon;
  color: string;
  index: number;
}

/** Solid metric card used by the presentation screens. */
export function MetricCard({ label, value, sub, icon: Icon, color, index }: MetricCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="rounded-md p-4"
      style={{ backgroundColor: color, border: `1px solid ${color}`, boxShadow: `0 14px 30px ${color}2E` }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...shortMotionTransition, delay: Math.min(index * 0.025, 0.1) }}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}>
          <Icon size={19} color="#fff" />
        </div>
        <span style={{ width: 34, height: 5, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.72)", opacity: 0.86 }} />
      </div>
      <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.05, marginTop: 14 }}>{value}</p>
      <p style={{ fontSize: 10.5, fontWeight: 850, color: "#fff", marginTop: 5 }}>{label}</p>
      <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.82)", marginTop: 3, lineHeight: 1.35 }}>{sub}</p>
    </motion.div>
  );
}

/** Plain white panel with a small uppercase title, as in the report screens. */
export function DashboardPanel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4" aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500">{title}</h2>
        {aside && <span className="text-xs text-gray-500">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

interface Segment {
  key: string;
  label: string;
  color: string;
  value: number;
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

/** One stacked bar with a legend that lists each status with its count and share. */
function StatusBreakdown({ segments, unit }: { segments: Segment[]; unit: string }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[22px] font-bold leading-none text-[#111827]">{total}</span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
      <div className="mt-3 flex h-2.5 gap-px overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
        {segments.filter((segment) => segment.value > 0).map((segment) => (
          <div key={segment.key} title={`${segment.label}: ${segment.value}`} style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 text-gray-600">{segment.label}</span>
            <span className="font-bold tabular-nums text-[#111827]">{segment.value}</span>
            <span className="w-9 text-right tabular-nums text-gray-400">{percent(segment.value, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectStatusDistribution({ data }: { data: CountByStatus[] }) {
  if (!sumCounts(data)) return <EmptyState text="Sin iniciativas para el periodo seleccionado." compact />;
  const countFor = (status: CountByStatus["status"]) => data.find((item) => item.status === status)?.count ?? 0;
  const segments = PROJECT_STATUS_ORDER.map((status) => ({
    key: status,
    label: projectStatusLabel[status],
    color: projectStatusColor[status],
    value: countFor(status),
  }));
  return <StatusBreakdown segments={segments} unit="iniciativas" />;
}

export function KeyResultsByStatus({ data }: { data: KeyResultCountByStatus[] }) {
  if (!sumCounts(data)) return <EmptyState text="Sin Key Results para el periodo seleccionado." compact />;
  const countFor = (status: KeyResultCountByStatus["status"]) => data.find((item) => item.status === status)?.count ?? 0;
  const segments = KEY_RESULT_STATUS_ORDER.map((status) => ({
    key: status,
    label: keyResultStatusLabel[status],
    color: keyResultStatusColor[status],
    value: countFor(status),
  }));
  return <StatusBreakdown segments={segments} unit="KRs" />;
}
