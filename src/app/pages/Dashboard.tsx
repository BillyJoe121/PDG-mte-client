import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import {
  dashboardApi,
  type CountByStatus,
  type DashboardData,
  type DashboardSummary,
  type ProgressBucket,
  type ProgressBucketCount,
} from "../services/dashboardApi";
import { objectivesApi, type ObjectiveCard } from "../services/strategicApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  purple: "#7C3AED",
  teal: "#14B8A6",
  red: "#DC2626",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;
const MAX_COVERAGE_ITEMS_PER_CHART = 6;
const AXIS_LABEL_MAX_CHARS = 18;
const viewMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: shortMotionTransition,
} as const;

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar el dashboard.";
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sumCounts<T extends { count: number }>(items: T[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function wrapLabel(value: string, maxChars = AXIS_LABEL_MAX_CHARS) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }
    if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
      return;
    }
    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [value];
}

function maxWrappedLines(items: CoverageItem[]) {
  return Math.max(1, ...items.map((item) => wrapLabel(item.name).length));
}

function buildKpis(summary: DashboardSummary, totalProjects: number) {
  return [
    {
      label: "Proyectos activos",
      value: summary.activeProjects,
      sub: `${summary.completedProjects} finalizados de ${totalProjects || 0} totales`,
      icon: FolderKanban,
      color: COLORS.green,
    },
    {
      label: "Objetivos en seguimiento",
      value: summary.objectivesInFollowUp,
      sub: `${summary.lowCompletionObjectives} requieren atencion`,
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
      label: "Cobertura estrategica",
      value: percent(summary.averageObjectiveCoverage),
      sub: `Cobertura KR ${percent(summary.averageKeyResultCoverage)}`,
      icon: Gauge,
      color: COLORS.purple,
    },
  ];
}

function buildGoalCoverage(cards: ObjectiveCard[]): GoalCoverageExecution[] {
  const groups = new Map<number, { goalName: string; objectives: number; keyResults: number; coverageSum: number }>();

  cards.forEach((card) => {
    const current = groups.get(card.goalId) ?? {
      goalName: card.goalName,
      objectives: 0,
      keyResults: 0,
      coverageSum: 0,
    };
    current.objectives += 1;
    current.keyResults += card.keyResults.length;
    current.coverageSum += card.completionPercentage;
    groups.set(card.goalId, current);
  });

  return [...groups.entries()]
    .map(([goalId, item]) => ({
      goalId,
      goalName: item.goalName,
      objectives: item.objectives,
      keyResults: item.keyResults,
      averageObjectiveCoverage: item.objectives ? item.coverageSum / item.objectives : 0,
    }))
    .sort((a, b) => b.averageObjectiveCoverage - a.averageObjectiveCoverage);
}

type DashboardDerived = {
  kpis: ReturnType<typeof buildKpis>;
};

interface GoalCoverageExecution {
  goalId: number;
  goalName: string;
  objectives: number;
  keyResults: number;
  averageObjectiveCoverage: number;
}

interface CoverageItem {
  id: number;
  name: string;
  objectives: number;
  keyResults: number;
  completedProjects?: number;
  inProgressProjects?: number;
  averageObjectiveCoverage: number;
}

export function Dashboard() {
  const { usuario } = useAuth();
  const { filters, setFilter } = useGlobalFilters();
  const initialPeriod = filters.periodo === "todos" ? "" : filters.periodo;
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [goalCoverage, setGoalCoverage] = useState<GoalCoverageExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activePeriodName = dashboard?.summary.period ?? periods.find((period) => period.status === "ACTIVO")?.name ?? "Periodo activo";
  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );

  const loadDashboard = useCallback(async (period?: string) => {
    setLoading(true);
    setError("");
    try {
      const periodList = await academicPeriodsApi.list();
      const selectedPeriodData = period
        ? periodList.find((item) => item.name === period)
        : periodList.find((item) => item.status === "ACTIVO");
      const [data, objectiveCards] = await Promise.all([
        dashboardApi.load(period),
        objectivesApi.cards({ periodId: selectedPeriodData?.id }),
      ]);
      setPeriods(periodList);
      setDashboard(data);
      setGoalCoverage(buildGoalCoverage(objectiveCards));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(selectedPeriod || undefined);
  }, [loadDashboard, selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    const next = value === "__active" ? "" : value;
    setSelectedPeriod(next);
    setFilter("periodo", next || "todos");
  };

  const derived = useMemo<DashboardDerived | null>(() => {
    if (!dashboard) return null;
    const totalProjects = sumCounts(dashboard.projectsByStatus);

    return {
      kpis: buildKpis(dashboard.summary, totalProjects),
    };
  }, [dashboard]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardHeader
        activePeriodName={activePeriodName}
        loading={loading}
        onPeriodChange={handlePeriodChange}
        onReload={() => void loadDashboard(selectedPeriod || undefined)}
        periods={sortedPeriods}
        selectedPeriod={selectedPeriod}
        summary={dashboard?.summary}
        userName={usuario?.nombre}
      />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <motion.div {...viewMotion} className="mb-5 flex items-center gap-2 rounded-md px-4 py-3" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 800 }}>
            <AlertTriangle size={15} /> {error}
          </motion.div>
        )}

        {loading && !dashboard ? (
          <motion.div {...viewMotion} className="flex items-center justify-center rounded-md bg-white py-20" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando KPIs del portafolio...
          </motion.div>
        ) : dashboard && derived ? (
          <motion.div {...viewMotion} className="space-y-5">
            <DashboardKpiGrid kpis={derived.kpis} />

            <main className="space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DashboardPanel
                  title="Proyectos por estado"
                  subtitle="Lectura operativa del portafolio segun su ciclo de vida."
                  icon={<FolderKanban size={16} />}
                >
                  <ProjectStatusDistribution data={dashboard.projectsByStatus} />
                </DashboardPanel>

                <DashboardPanel
                  title="KRs por progreso"
                  subtitle="Distribucion de resultados clave por avance y riesgo."
                  icon={<Activity size={16} />}
                >
                  <KeyResultsProgress data={dashboard.keyResultsByProgress} />
                </DashboardPanel>
              </div>

              <DashboardPanel
                title="Rendimiento por departamento"
                subtitle="Cobertura promedio, objetivos y volumen de ejecucion por unidad."
                icon={<Layers3 size={16} />}
              >
                <DepartmentPerformance data={dashboard.departments} />
              </DashboardPanel>

              <DashboardPanel
                title="Cobertura por apuesta estrategica"
                subtitle="Alineacion de objetivos, KRs y proyectos alrededor de cada apuesta."
                icon={<BarChart3 size={16} />}
              >
                <StrategicBetCoverage data={dashboard.strategicBets} />
              </DashboardPanel>

              <DashboardPanel
                title="Cobertura por meta"
                subtitle="Cobertura promedio de objetivos agrupados por meta institucional."
                icon={<Target size={16} />}
              >
                <GoalCoverage data={goalCoverage} />
              </DashboardPanel>
            </main>
          </motion.div>
        ) : (
          <EmptyState text="Sin datos para el periodo seleccionado." />
        )}
      </div>
    </div>
  );
}

function DashboardHeader({
  activePeriodName,
  loading,
  onPeriodChange,
  onReload,
  periods,
  selectedPeriod,
  summary,
  userName,
}: {
  activePeriodName: string;
  loading: boolean;
  onPeriodChange: (value: string) => void;
  onReload: () => void;
  periods: AcademicPeriod[];
  selectedPeriod: string;
  summary?: DashboardSummary;
  userName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const firstName = userName?.split(" ")[0] ?? "el equipo";

  return (
    <motion.div
      className="flex-shrink-0 bg-white px-6 pb-4 pt-5"
      style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shortMotionTransition}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>Centro de mando estrategico</p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.text, lineHeight: 1.15, marginTop: 3 }}>Dashboard de impacto</h1>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
            Seguimiento ejecutivo del portafolio para {firstName}.
            {summary && (
              <>
                {" "}{summary.activeProjects} activos - {summary.objectivesInFollowUp} objetivos - {summary.completedKeyResults + summary.inProgressKeyResults} KRs - {percent(summary.averageObjectiveCoverage)} cobertura
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod || "__active"} onValueChange={onPeriodChange}>
            <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
              <SelectItem value="__active" className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
                Periodo activo
              </SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.name} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={onReload}
            disabled={loading}
            className="flex items-center justify-center rounded-md transition-opacity disabled:opacity-50"
            style={{ width: 38, height: 38, border: "1px solid #E5E7EB", backgroundColor: "#fff" }}
            title="Recargar dashboard"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
          <span className="rounded-md px-3 py-2" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: 11, fontWeight: 850 }}>
            {selectedPeriod || activePeriodName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardKpiGrid({ kpis }: { kpis: ReturnType<typeof buildKpis> }) {
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
}: ReturnType<typeof buildKpis>[number] & { index: number }) {
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

function DashboardPanel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
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

function ProjectStatusDistribution({ data }: { data: CountByStatus[] }) {
  const total = sumCounts(data);
  if (!total) return <EmptyState text="Sin proyectos para el periodo seleccionado." compact />;

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

function KeyResultsProgress({ data }: { data: ProgressBucketCount[] }) {
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

function DepartmentPerformance({ data }: { data: DashboardData["departments"] }) {
  if (!data.length) return <EmptyState text="Sin departamentos para comparar." compact />;
  const ordered = [...data].sort((a, b) => b.averageObjectiveCoverage - a.averageObjectiveCoverage);

  return (
    <div className="space-y-2">
      {ordered.map((department) => {
        const coverage = clampPercent(department.averageObjectiveCoverage);
        const color = coverage >= 70 ? COLORS.green : coverage < 35 ? COLORS.orange : COLORS.blue;
        return (
          <div key={department.departmentId} className="grid grid-cols-1 gap-3 rounded-md p-3 md:grid-cols-[minmax(0,1fr)_260px]" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, lineHeight: 1.25 }}>{department.departmentName}</p>
                  <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>
                    {department.objectives} objetivos - {department.completedKeyResults + department.inProgressKeyResults} KRs - {department.activeProjects} activos - {department.completedProjects} finalizados
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color }}>{coverage}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF2F7]">
                <div style={{ width: `${coverage}%`, height: "100%", backgroundColor: color }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Activos" value={department.activeProjects} />
              <MiniStat label="Final." value={department.completedProjects} />
              <MiniStat label="Objetivos" value={department.objectives} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StrategicBetCoverage({ data }: { data: DashboardData["strategicBets"] }) {
  if (!data.length) return <EmptyState text="Sin apuestas estrategicas para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.strategicBetId,
    name: item.strategicBetName,
    objectives: item.objectives,
    keyResults: item.keyResults,
    completedProjects: item.completedProjects,
    inProgressProjects: item.inProgressProjects,
    averageObjectiveCoverage: item.averageObjectiveCoverage,
  }));

  return <CoverageCharts barColor={COLORS.purple} data={items} emptyText="Sin apuestas estrategicas para el periodo." metricLabel="Apuesta" showProjects />;
}

function GoalCoverage({ data }: { data: GoalCoverageExecution[] }) {
  if (!data.length) return <EmptyState text="Sin metas con objetivos para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.goalId,
    name: item.goalName,
    objectives: item.objectives,
    keyResults: item.keyResults,
    averageObjectiveCoverage: item.averageObjectiveCoverage,
  }));

  return <CoverageCharts barColor={COLORS.green} data={items} emptyText="Sin metas con objetivos para el periodo." metricLabel="Meta" />;
}

function CoverageCharts({
  barColor,
  data,
  emptyText,
  metricLabel,
  showProjects = false,
}: {
  barColor: string;
  data: CoverageItem[];
  emptyText: string;
  metricLabel: string;
  showProjects?: boolean;
}) {
  if (!data.length) return <EmptyState text={emptyText} compact />;
  const chunks = chunkItems(data, MAX_COVERAGE_ITEMS_PER_CHART);

  return (
    <div className="space-y-4">
      {chunks.map((chunk, index) => (
        <CoverageChart key={`${metricLabel}-${index}`} barColor={barColor} data={chunk} metricLabel={metricLabel} index={index} total={chunks.length} />
      ))}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data.map((item) => (
          <CoverageSummaryCard key={item.id} barColor={barColor} item={item} showProjects={showProjects} />
        ))}
      </div>
    </div>
  );
}

function CoverageChart({ barColor, data, metricLabel, index, total }: { barColor: string; data: CoverageItem[]; metricLabel: string; index: number; total: number }) {
  const maxLines = maxWrappedLines(data);
  const axisHeight = Math.max(72, maxLines * 14 + 30);

  return (
    <div className="rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      {total > 1 && (
        <p style={{ fontSize: 10, fontWeight: 850, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>
          {metricLabel}s {index * MAX_COVERAGE_ITEMS_PER_CHART + 1}-{index * MAX_COVERAGE_ITEMS_PER_CHART + data.length}
        </p>
      )}
      <div style={{ width: "100%", height: 260 + axisHeight }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              interval={0}
              height={axisHeight}
              tick={<WrappedAxisTick />}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.gray }} />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              formatter={(value) => [`${Math.round(Number(value))}%`, "Cobertura"]}
            />
            <Bar dataKey="averageObjectiveCoverage" name="Cobertura" radius={[5, 5, 0, 0]}>
              {data.map((item) => (
                <Cell key={item.id} fill={barColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WrappedAxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const lines = wrapLabel(String(payload?.value ?? ""));
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={0}
          y={index * 14}
          textAnchor="middle"
          fill={COLORS.gray}
          fontSize={10}
          fontWeight={800}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function CoverageSummaryCard({ barColor, item, showProjects }: { barColor: string; item: CoverageItem; showProjects: boolean }) {
  const coverage = clampPercent(item.averageObjectiveCoverage);
  const projectText = showProjects
    ? ` - ${item.inProgressProjects ?? 0} proyectos en progreso - ${item.completedProjects ?? 0} finalizados`
    : "";

  return (
    <div className="rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      <div className="flex items-start justify-between gap-3">
        <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, lineHeight: 1.35 }}>{item.name}</p>
        <span style={{ fontSize: 13, fontWeight: 900, color: barColor }}>{coverage}%</span>
      </div>
      <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 6, lineHeight: 1.45 }}>
        {item.objectives} objetivos - {item.keyResults} KRs{projectText}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
        <div style={{ width: `${coverage}%`, height: "100%", backgroundColor: barColor }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white p-2 text-center" style={{ border: "1px solid #EEF2F7" }}>
      <p style={{ fontSize: 14, fontWeight: 900, color: COLORS.text }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 850, color: "#9CA3AF", textTransform: "uppercase", marginTop: 2 }}>{label}</p>
    </div>
  );
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className="flex items-center justify-center rounded-md text-center" style={{ minHeight: compact ? 180 : 260, backgroundColor: "#F8FAFC", border: `1px dashed ${COLORS.border}`, color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
      {text}
    </div>
  );
}

const selectControlStyle: CSSProperties = {
  width: 190,
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};
