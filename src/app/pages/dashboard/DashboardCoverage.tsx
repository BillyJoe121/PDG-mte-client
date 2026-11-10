import { lazy, Suspense } from "react";
import { DeferredRender } from "../../components/DeferredRender";
import type { DashboardData, GoalExecution } from "../../services/dashboardApi";
import type { KeyResultStatus } from "../../services/strategicApi";
import { KEY_RESULT_STATUS_ORDER, keyResultStatusColor, keyResultStatusCountField } from "./keyResultStatusMeta";

const COLORS = {
  purple: "#7C3AED",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
};

const MAX_COVERAGE_ITEMS_PER_CHART = 6;
const DashboardCoverageChart = lazy(() => import("./DashboardCoverageChart"));

export type CoverageScope = "department" | "strategicBet" | "goal";

/** Key result counts by status for one department, strategic bet or goal. */
export interface CoverageItem {
  id: number;
  name: string;
  keyResults: number;
  draftKeyResults: number;
  activeKeyResults: number;
  closedKeyResults: number;
  completedProjects?: number;
  inProgressProjects?: number;
}

type StatusClick = (item: CoverageItem, status: KeyResultStatus) => void;

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function DepartmentPerformance({ data, onStatusClick }: { data: DashboardData["departments"]; onStatusClick: StatusClick }) {
  if (!data.length) return <DashboardEmptyState text="Sin departamentos para comparar." compact />;
  const items = data
    .map((department) => ({
      id: department.departmentId,
      name: department.departmentName,
      keyResults: department.keyResults,
      draftKeyResults: department.draftKeyResults,
      activeKeyResults: department.activeKeyResults,
      closedKeyResults: department.closedKeyResults,
      completedProjects: department.completedProjects,
      inProgressProjects: department.activeProjects,
    }))
    .filter((item) => item.keyResults > 0)
    .sort((a, b) => b.keyResults - a.keyResults || a.name.localeCompare(b.name));

  return <CoverageCharts data={items} emptyText="Sin KRs por departamento para el periodo." metricLabel="Departamento" onStatusClick={onStatusClick} showProjects />;
}

export function StrategicBetCoverage({ data, onStatusClick }: { data: DashboardData["strategicBets"]; onStatusClick: StatusClick }) {
  if (!data.length) return <DashboardEmptyState text="Sin apuestas estrategicas para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.strategicBetId,
    name: item.strategicBetName,
    keyResults: item.keyResults,
    draftKeyResults: item.draftKeyResults,
    activeKeyResults: item.activeKeyResults,
    closedKeyResults: item.closedKeyResults,
    completedProjects: item.completedProjects,
    inProgressProjects: item.inProgressProjects,
  }));

  return <CoverageCharts data={items} emptyText="Sin apuestas estrategicas para el periodo." metricLabel="Apuesta" onStatusClick={onStatusClick} showProjects labelMaxLines={3} />;
}

export function GoalCoverage({ data, onStatusClick }: { data: GoalExecution[]; onStatusClick: StatusClick }) {
  if (!data.length) return <DashboardEmptyState text="Sin metas con KRs para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.goalId,
    name: item.goalName,
    keyResults: item.keyResults,
    draftKeyResults: item.draftKeyResults,
    activeKeyResults: item.activeKeyResults,
    closedKeyResults: item.closedKeyResults,
    completedProjects: item.completedProjects,
    inProgressProjects: item.inProgressProjects,
  }));

  return <CoverageCharts data={items} emptyText="Sin metas con KRs para el periodo." metricLabel="Meta" onStatusClick={onStatusClick} labelMaxLines={3} />;
}

function CoverageCharts({
  data,
  emptyText,
  metricLabel,
  onStatusClick,
  showProjects = false,
  labelMaxLines = 2,
}: {
  data: CoverageItem[];
  emptyText: string;
  metricLabel: string;
  onStatusClick: StatusClick;
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
              onStatusClick={(item, status) => onStatusClick(item as CoverageItem, status)}
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
  const countedByStatus = item.draftKeyResults + item.activeKeyResults + item.closedKeyResults;
  const projectText = showProjects
    ? ` - ${item.inProgressProjects ?? 0} iniciativas en progreso - ${item.completedProjects ?? 0} finalizadas`
    : "";
  const statusText = `${item.draftKeyResults} en borrador, ${item.activeKeyResults} activos, ${item.closedKeyResults} cerrados`;

  return (
    <div className="rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      <div className="flex items-start justify-between gap-3">
        <p style={{ fontSize: 10.5, fontWeight: 900, color: COLORS.text, lineHeight: 1.35 }}>{item.name}</p>
        <span style={{ fontSize: 11, fontWeight: 900, color: COLORS.purple }}>{item.keyResults}</span>
      </div>
      <p style={{ fontSize: 9, color: COLORS.gray, marginTop: 6, lineHeight: 1.45 }}>
        {item.keyResults} KRs{projectText}
      </p>
      <p style={{ fontSize: 10.5, color: COLORS.text, fontWeight: 400, marginTop: 8, lineHeight: 1.45 }}>
        {statusText}
      </p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#EEF2F7]">
        {countedByStatus > 0 ? (
          KEY_RESULT_STATUS_ORDER.map((status) => (
            <div key={status} style={{ width: `${(item[keyResultStatusCountField[status]] / countedByStatus) * 100}%`, backgroundColor: keyResultStatusColor[status] }} />
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
    <div className="flex items-center justify-center rounded-md text-center" style={{ minHeight: compact ? 180 : 260, backgroundColor: "#F8FAFC", border: `1px dashed ${COLORS.border}`, color: COLORS.gray, fontSize: 10.5, fontWeight: 800 }}>
      {text}
    </div>
  );
}
