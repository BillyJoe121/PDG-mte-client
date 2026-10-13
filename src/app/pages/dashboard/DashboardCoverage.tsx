import { lazy, Suspense } from "react";
import { DeferredRender } from "../../components/DeferredRender";
import type { DashboardData, GoalExecution } from "../../services/dashboardApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  purple: "#7C3AED",
  red: "#DC2626",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
};

const MAX_COVERAGE_ITEMS_PER_CHART = 6;
const DashboardCoverageChart = lazy(() => import("./DashboardCoverageChart"));

export const keyResultBucketMeta = {
  completedKeyResults: { label: "KRs al 100", color: COLORS.green },
  keyResultsAbove50: { label: "50% o mas", color: COLORS.blue },
  keyResultsBetween0And50: { label: "De 0 a 50", color: COLORS.orange },
  keyResultsAtZero: { label: "Al 0", color: COLORS.red },
} as const;

export type KeyResultBucketKey = keyof typeof keyResultBucketMeta;
export type CoverageScope = "department" | "strategicBet" | "goal";

/** Equivalencia entre los buckets del dashboard y el filtro de avance de la pantalla de KRs. */
export const keyResultBucketToProgressFilter: Record<KeyResultBucketKey, string> = {
  completedKeyResults: "completado",
  keyResultsAbove50: "avanzado",
  keyResultsBetween0And50: "proceso",
  keyResultsAtZero: "iniciando",
};

export interface CoverageItem {
  id: number;
  name: string;
  keyResults: number;
  completedKeyResults: number;
  keyResultsAbove50: number;
  keyResultsBetween0And50: number;
  keyResultsAtZero: number;
  completedProjects?: number;
  inProgressProjects?: number;
}

type BucketClick = (item: CoverageItem, bucket: KeyResultBucketKey) => void;

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function DepartmentPerformance({ data, onBucketClick }: { data: DashboardData["departments"]; onBucketClick: BucketClick }) {
  if (!data.length) return <DashboardEmptyState text="Sin departamentos para comparar." compact />;
  const items = data
    .map((department) => ({
      id: department.departmentId,
      name: department.departmentName,
      keyResults: department.keyResults,
      completedKeyResults: department.completedKeyResults,
      keyResultsAbove50: department.keyResultsAbove50,
      keyResultsBetween0And50: department.keyResultsBetween0And50,
      keyResultsAtZero: department.keyResultsAtZero,
      completedProjects: department.completedProjects,
      inProgressProjects: department.activeProjects,
    }))
    .filter((item) => item.keyResults > 0)
    .sort((a, b) => b.keyResults - a.keyResults || a.name.localeCompare(b.name));

  return <CoverageCharts data={items} emptyText="Sin KRs por departamento para el periodo." metricLabel="Departamento" onBucketClick={onBucketClick} showProjects />;
}

export function StrategicBetCoverage({ data, onBucketClick }: { data: DashboardData["strategicBets"]; onBucketClick: BucketClick }) {
  if (!data.length) return <DashboardEmptyState text="Sin apuestas estrategicas para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.strategicBetId,
    name: item.strategicBetName,
    keyResults: item.keyResults,
    completedKeyResults: item.completedKeyResults,
    keyResultsAbove50: item.keyResultsAbove50,
    keyResultsBetween0And50: item.keyResultsBetween0And50,
    keyResultsAtZero: item.keyResultsAtZero,
    completedProjects: item.completedProjects,
    inProgressProjects: item.inProgressProjects,
  }));

  return <CoverageCharts data={items} emptyText="Sin apuestas estrategicas para el periodo." metricLabel="Apuesta" onBucketClick={onBucketClick} showProjects labelMaxLines={3} />;
}

export function GoalCoverage({ data, onBucketClick }: { data: GoalExecution[]; onBucketClick: BucketClick }) {
  if (!data.length) return <DashboardEmptyState text="Sin metas con KRs para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.goalId,
    name: item.goalName,
    keyResults: item.keyResults,
    completedKeyResults: item.completedKeyResults,
    keyResultsAbove50: item.keyResultsAbove50,
    keyResultsBetween0And50: item.keyResultsBetween0And50,
    keyResultsAtZero: item.keyResultsAtZero,
    completedProjects: item.completedProjects,
    inProgressProjects: item.inProgressProjects,
  }));

  return <CoverageCharts data={items} emptyText="Sin metas con KRs para el periodo." metricLabel="Meta" onBucketClick={onBucketClick} labelMaxLines={3} />;
}

function CoverageCharts({
  data,
  emptyText,
  metricLabel,
  onBucketClick,
  showProjects = false,
  labelMaxLines = 2,
}: {
  data: CoverageItem[];
  emptyText: string;
  metricLabel: string;
  onBucketClick: BucketClick;
  showProjects?: boolean;
  labelMaxLines?: number;
}) {
  if (!data.length) return <DashboardEmptyState text={emptyText} compact />;
  const chunks = chunkItems(data, MAX_COVERAGE_ITEMS_PER_CHART);

  return (
    <div className="space-y-4">
      {chunks.map((chunk, index) => (
        <DeferredRender key={`${metricLabel}-${index}`} minHeight={340}>
          <Suspense fallback={<div className="h-[340px] animate-pulse rounded-md border border-[#D9DEE8] bg-[#F8FAFC] motion-reduce:animate-none" aria-label="Cargando gráfico" />}>
            <DashboardCoverageChart
              data={chunk}
              metricLabel={metricLabel}
              index={index}
              total={chunks.length}
              labelMaxLines={labelMaxLines}
              onBucketClick={(item, bucket) => onBucketClick(item as CoverageItem, bucket)}
            />
          </Suspense>
        </DeferredRender>
      ))}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data.map((item) => (
          <CoverageSummaryCard key={item.id} item={item} showProjects={showProjects} />
        ))}
      </div>
    </div>
  );
}

function CoverageSummaryCard({ item, showProjects }: { item: CoverageItem; showProjects: boolean }) {
  const totalBuckets = item.completedKeyResults + item.keyResultsAbove50 + item.keyResultsBetween0And50 + item.keyResultsAtZero;
  const projectText = showProjects
    ? ` - ${item.inProgressProjects ?? 0} iniciativas en progreso - ${item.completedProjects ?? 0} finalizadas`
    : "";
  const bucketText = `${item.completedKeyResults} KRs completados, ${item.keyResultsAbove50} con mas del 50%, ${item.keyResultsBetween0And50} entre 0 y 50%, ${item.keyResultsAtZero} en 0%`;

  return (
    <div className="rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      <div className="flex items-start justify-between gap-3">
        <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, lineHeight: 1.35 }}>{item.name}</p>
        <span style={{ fontSize: 13, fontWeight: 900, color: COLORS.purple }}>{item.keyResults}</span>
      </div>
      <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 6, lineHeight: 1.45 }}>
        {item.keyResults} KRs{projectText}
      </p>
      <p style={{ fontSize: 11, color: COLORS.text, fontWeight: 400, marginTop: 8, lineHeight: 1.45 }}>
        {bucketText}
      </p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#EEF2F7]">
        {totalBuckets > 0 ? (
          (Object.keys(keyResultBucketMeta) as KeyResultBucketKey[]).map((bucket) => (
            <div key={bucket} style={{ width: `${(item[bucket] / totalBuckets) * 100}%`, backgroundColor: keyResultBucketMeta[bucket].color }} />
          ))
        ) : (
          <div style={{ width: "100%", backgroundColor: "#E5E7EB" }} />
        )}
      </div>
    </div>
  );
}

export function DashboardEmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className="flex items-center justify-center rounded-md text-center" style={{ minHeight: compact ? 180 : 260, backgroundColor: "#F8FAFC", border: `1px dashed ${COLORS.border}`, color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
      {text}
    </div>
  );
}
