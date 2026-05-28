import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
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
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { ObjectiveCard } from "../services/strategicApi";
import {
  type CountByStatus,
  type DashboardData,
  type DashboardSummary,
  type GoalExecution,
  type ProgressBucket,
  type ProgressBucketCount,
} from "../services/dashboardApi";
import { loadDashboardScreen, loadObjectiveCards, prefetchStrategicScreens } from "../services/screenDataCache";

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
const AXIS_LABEL_MAX_CHARS = 26;
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

const objectiveBucketMeta = {
  completedObjectives: { label: "Objetivos al 100", color: COLORS.green },
  objectivesAbove50: { label: "50% o mas", color: COLORS.blue },
  objectivesBetween0And50: { label: "De 0 a 50", color: COLORS.orange },
  objectivesAtZero: { label: "Al 0", color: COLORS.red },
} as const;

type ObjectiveBucketKey = keyof typeof objectiveBucketMeta;
type ObjectiveScope = "department" | "strategicBet" | "goal";

const objectiveBucketToProgressFilter: Record<ObjectiveBucketKey, string> = {
  completedObjectives: "completado",
  objectivesAbove50: "avanzado",
  objectivesBetween0And50: "proceso",
  objectivesAtZero: "iniciando",
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

function wrapLabel(value: string, maxChars = AXIS_LABEL_MAX_CHARS, maxLines = 0) {
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
  const result = lines.length > 0 ? lines : [value];

  if (maxLines > 0 && result.length > maxLines) {
    return [...result.slice(0, maxLines - 1), result.slice(maxLines - 1).join(" ")];
  }
  return result;
}

function maxWrappedLines(items: CoverageItem[], maxLines: number) {
  return Math.max(1, ...items.map((item) => wrapLabel(item.name, AXIS_LABEL_MAX_CHARS, maxLines).length));
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
      label: "Objetivos completados",
      value: summary.completedObjectives,
      sub: `${summary.objectivesAbove50} con mas del 50%, ${summary.objectivesBetween0And50} entre 0 y 50%, ${summary.objectivesAtZero} en 0%`,
      icon: Gauge,
      color: COLORS.blue,
    },
  ];
}

type DashboardDerived = {
  kpis: ReturnType<typeof buildKpis>;
};

interface CoverageItem {
  id: number;
  name: string;
  objectives: number;
  completedObjectives: number;
  objectivesAbove50: number;
  objectivesBetween0And50: number;
  objectivesAtZero: number;
  keyResults: number;
  completedProjects?: number;
  inProgressProjects?: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { filters, setFilter } = useGlobalFilters();
  const initialPeriod = filters.periodo === "todos" ? "" : filters.periodo;
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [objectiveCards, setObjectiveCards] = useState<ObjectiveCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activePeriodName = dashboard?.summary.period ?? periods.find((period) => period.status === "ACTIVO")?.name ?? "Periodo activo";
  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );

  const loadDashboard = useCallback(async (period?: string, options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await loadDashboardScreen(period, { force: options?.force });
      const periodName = period || data.dashboard.summary.period;
      const periodId = data.periods.find((item) => item.name === periodName)?.id;
      const cards = await loadObjectiveCards(periodId ? { periodId } : undefined, { force: options?.force });
      setPeriods(data.periods);
      setDashboard(data.dashboard);
      setObjectiveCards(cards);
      prefetchStrategicScreens(period);
    } catch (err) {
      if (!options?.silent) setError(getErrorMessage(err));
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(selectedPeriod || undefined);
  }, [loadDashboard, selectedPeriod]);

  useStrategicDataRefresh({
    scopes: ["dashboard"],
    onRefresh: () => loadDashboard(selectedPeriod || undefined, { force: true, silent: true }),
  });

  const handlePeriodChange = (value: string) => {
    const next = value === "__active" ? "" : value;
    setSelectedPeriod(next);
    setFilter("periodo", next || "todos");
  };

  const openObjectivesFromBucket = useCallback((scope: ObjectiveScope, item: CoverageItem, bucket: ObjectiveBucketKey) => {
    const params = new URLSearchParams();
    const periodName = selectedPeriod || dashboard?.summary.period;
    const periodId = periods.find((period) => period.name === periodName)?.id;

    params.set("progress", objectiveBucketToProgressFilter[bucket]);
    if (periodId) params.set("periodId", String(periodId));
    if (scope === "department") params.set("departmentId", String(item.id));
    if (scope === "strategicBet") params.set("strategicBetId", String(item.id));
    if (scope === "goal") params.set("goalId", String(item.id));

    navigate(`/okrs?${params.toString()}`);
  }, [dashboard?.summary.period, navigate, periods, selectedPeriod]);

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
        onReload={() => void loadDashboard(selectedPeriod || undefined, { force: true })}
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
                subtitle="Objetivos agrupados por departamento segun sus rangos de avance."
                icon={<Layers3 size={16} />}
              >
                <DepartmentPerformance
                  data={dashboard.departments}
                  objectiveCards={objectiveCards}
                  onBucketClick={(item, bucket) => openObjectivesFromBucket("department", item, bucket)}
                />
              </DashboardPanel>

              <DashboardPanel
                title="Cobertura por apuesta estrategica"
                subtitle="Alineacion de objetivos, KRs y proyectos alrededor de cada apuesta."
                icon={<BarChart3 size={16} />}
              >
                <StrategicBetCoverage
                  data={dashboard.strategicBets}
                  onBucketClick={(item, bucket) => openObjectivesFromBucket("strategicBet", item, bucket)}
                />
              </DashboardPanel>

              <DashboardPanel
                title="Cobertura por meta"
                subtitle="Objetivos agrupados por meta institucional segun sus buckets de avance."
                icon={<Target size={16} />}
              >
                <GoalCoverage
                  data={dashboard.goals}
                  onBucketClick={(item, bucket) => openObjectivesFromBucket("goal", item, bucket)}
                />
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
                {" "}{summary.activeProjects} activos - {summary.objectivesInFollowUp} objetivos - {summary.completedKeyResults + summary.inProgressKeyResults} KRs - {summary.completedObjectives} objetivos completados
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

function DepartmentPerformance({
  data,
  objectiveCards,
  onBucketClick,
}: {
  data: DashboardData["departments"];
  objectiveCards: ObjectiveCard[];
  onBucketClick: (item: CoverageItem, bucket: ObjectiveBucketKey) => void;
}) {
  if (!data.length) return <EmptyState text="Sin departamentos para comparar." compact />;

  const itemsByDepartment = new Map<string, CoverageItem>();
  data.forEach((department) => {
    itemsByDepartment.set(department.departmentName, {
      id: department.departmentId,
      name: department.departmentName,
      objectives: 0,
      completedObjectives: 0,
      objectivesAbove50: 0,
      objectivesBetween0And50: 0,
      objectivesAtZero: 0,
      keyResults: 0,
      completedProjects: department.completedProjects,
      inProgressProjects: department.activeProjects,
    });
  });

  objectiveCards.forEach((card) => {
    const name = card.departmentName || "Sin departamento";
    const current = itemsByDepartment.get(name) ?? {
      id: card.departmentId,
      name,
      objectives: 0,
      completedObjectives: 0,
      objectivesAbove50: 0,
      objectivesBetween0And50: 0,
      objectivesAtZero: 0,
      keyResults: 0,
      completedProjects: 0,
      inProgressProjects: 0,
    };
    const progress = clampPercent(Number.isFinite(card.completionPercentage) ? card.completionPercentage : 0);

    current.objectives += 1;
    current.keyResults += card.keyResults.length;
    if (progress >= 100) current.completedObjectives += 1;
    else if (progress >= 50) current.objectivesAbove50 += 1;
    else if (progress > 0) current.objectivesBetween0And50 += 1;
    else current.objectivesAtZero += 1;

    itemsByDepartment.set(name, current);
  });

  const items = [...itemsByDepartment.values()]
    .filter((item) => item.objectives > 0)
    .sort((a, b) => b.objectives - a.objectives || a.name.localeCompare(b.name));

  return <CoverageCharts data={items} emptyText="Sin objetivos por departamento para el periodo." metricLabel="Departamento" onBucketClick={onBucketClick} showProjects />;
}

function StrategicBetCoverage({
  data,
  onBucketClick,
}: {
  data: DashboardData["strategicBets"];
  onBucketClick: (item: CoverageItem, bucket: ObjectiveBucketKey) => void;
}) {
  if (!data.length) return <EmptyState text="Sin apuestas estrategicas para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.strategicBetId,
    name: item.strategicBetName,
    objectives: item.objectives,
    completedObjectives: item.completedObjectives,
    objectivesAbove50: item.objectivesAbove50,
    objectivesBetween0And50: item.objectivesBetween0And50,
    objectivesAtZero: item.objectivesAtZero,
    keyResults: item.keyResults,
    completedProjects: item.completedProjects,
    inProgressProjects: item.inProgressProjects,
  }));

  return <CoverageCharts data={items} emptyText="Sin apuestas estrategicas para el periodo." metricLabel="Apuesta" onBucketClick={onBucketClick} showProjects labelMaxLines={3} />;
}

function GoalCoverage({
  data,
  onBucketClick,
}: {
  data: GoalExecution[];
  onBucketClick: (item: CoverageItem, bucket: ObjectiveBucketKey) => void;
}) {
  if (!data.length) return <EmptyState text="Sin metas con objetivos para el periodo." compact />;
  const items = data.map((item) => ({
    id: item.goalId,
    name: item.goalName,
    objectives: item.objectives,
    completedObjectives: item.completedObjectives,
    objectivesAbove50: item.objectivesAbove50,
    objectivesBetween0And50: item.objectivesBetween0And50,
    objectivesAtZero: item.objectivesAtZero,
    keyResults: item.keyResults,
    completedProjects: item.completedProjects,
    inProgressProjects: item.inProgressProjects,
  }));

  return <CoverageCharts data={items} emptyText="Sin metas con objetivos para el periodo." metricLabel="Meta" onBucketClick={onBucketClick} labelMaxLines={3} />;
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
  onBucketClick: (item: CoverageItem, bucket: ObjectiveBucketKey) => void;
  showProjects?: boolean;
  labelMaxLines?: number;
}) {
  if (!data.length) return <EmptyState text={emptyText} compact />;
  const chunks = chunkItems(data, MAX_COVERAGE_ITEMS_PER_CHART);

  return (
    <div className="space-y-4">
      {chunks.map((chunk, index) => (
        <CoverageChart
          key={`${metricLabel}-${index}`}
          data={chunk}
          metricLabel={metricLabel}
          index={index}
          total={chunks.length}
          labelMaxLines={labelMaxLines}
          onBucketClick={onBucketClick}
        />
      ))}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {data.map((item) => (
          <CoverageSummaryCard key={item.id} item={item} showProjects={showProjects} />
        ))}
      </div>
    </div>
  );
}

function CoverageChart({
  data,
  metricLabel,
  index,
  total,
  labelMaxLines,
  onBucketClick,
}: {
  data: CoverageItem[];
  metricLabel: string;
  index: number;
  total: number;
  labelMaxLines: number;
  onBucketClick: (item: CoverageItem, bucket: ObjectiveBucketKey) => void;
}) {
  const maxLines = maxWrappedLines(data, labelMaxLines);
  const axisHeight = Math.max(72, maxLines * 17 + 40);
  const handleBucketClick = (payload: unknown, bucket: ObjectiveBucketKey) => {
    const item = (payload as { payload?: CoverageItem } | undefined)?.payload;
    if (!item || item[bucket] <= 0) return;
    onBucketClick(item, bucket);
  };

  const yMax = Math.max(
    1,
    ...data.map((item) =>
      Math.max(
        item.completedObjectives,
        item.objectivesAbove50,
        item.objectivesBetween0And50,
        item.objectivesAtZero,
      ),
    ),
  );
  const yDomain: [number, number] = [0, yMax];

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
              tick={<WrappedAxisTick maxLines={labelMaxLines} />}
              tickLine={false}
            />
            <YAxis allowDecimals={false} domain={yDomain} tick={{ fontSize: 11, fill: COLORS.gray }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 800, paddingTop: 8 }} />
            <Tooltip
              cursor={{ fill: "#F8FAFC" }}
              formatter={(value, name) => [Number(value), `${String(name)} - clic para ver objetivos`]}
              contentStyle={{ padding: "6px 10px", fontSize: "10px", borderRadius: "6px", lineHeight: "1.2" }}
              itemStyle={{ padding: 0, margin: "2px 0", fontSize: "10px" }}
              labelStyle={{ fontSize: "10px", fontWeight: 800, marginBottom: "4px", color: COLORS.text }}
            />
            <Bar
              className="cursor-pointer"
              dataKey="completedObjectives"
              name={objectiveBucketMeta.completedObjectives.label}
              fill={objectiveBucketMeta.completedObjectives.color}
              onClick={(payload) => handleBucketClick(payload, "completedObjectives")}
            />
            <Bar
              className="cursor-pointer"
              dataKey="objectivesAbove50"
              name={objectiveBucketMeta.objectivesAbove50.label}
              fill={objectiveBucketMeta.objectivesAbove50.color}
              onClick={(payload) => handleBucketClick(payload, "objectivesAbove50")}
            />
            <Bar
              className="cursor-pointer"
              dataKey="objectivesBetween0And50"
              name={objectiveBucketMeta.objectivesBetween0And50.label}
              fill={objectiveBucketMeta.objectivesBetween0And50.color}
              onClick={(payload) => handleBucketClick(payload, "objectivesBetween0And50")}
            />
            <Bar
              className="cursor-pointer"
              dataKey="objectivesAtZero"
              name={objectiveBucketMeta.objectivesAtZero.label}
              fill={objectiveBucketMeta.objectivesAtZero.color}
              onClick={(payload) => handleBucketClick(payload, "objectivesAtZero")}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WrappedAxisTick({ x, y, payload, maxLines = 2 }: { x?: number; y?: number; payload?: { value?: string }; maxLines?: number }) {
  const lines = wrapLabel(String(payload?.value ?? ""), AXIS_LABEL_MAX_CHARS, maxLines);
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={0}
          y={index * 17 + 14}
          textAnchor="middle"
          fill={COLORS.gray}
          fontSize={12}
          fontWeight={700}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function CoverageSummaryCard({ item, showProjects }: { item: CoverageItem; showProjects: boolean }) {
  const totalBuckets = item.completedObjectives + item.objectivesAbove50 + item.objectivesBetween0And50 + item.objectivesAtZero;
  const projectText = showProjects
    ? ` - ${item.inProgressProjects ?? 0} proyectos en progreso - ${item.completedProjects ?? 0} finalizados`
    : "";
  const bucketText = `${item.completedObjectives} objetivos completados, ${item.objectivesAbove50} con mas del 50%, ${item.objectivesBetween0And50} entre 0 y 50%, ${item.objectivesAtZero} en 0%`;

  return (
    <div className="rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      <div className="flex items-start justify-between gap-3">
        <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, lineHeight: 1.35 }}>{item.name}</p>
        <span style={{ fontSize: 13, fontWeight: 900, color: COLORS.purple }}>{item.objectives}</span>
      </div>
      <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 6, lineHeight: 1.45 }}>
        {item.objectives} objetivos - {item.keyResults} KRs{projectText}
      </p>
      <p style={{ fontSize: 11, color: COLORS.text, fontWeight: 400, marginTop: 8, lineHeight: 1.45 }}>
        {bucketText}
      </p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#EEF2F7]">
        {totalBuckets > 0 ? (
          <>
            <div style={{ width: `${(item.completedObjectives / totalBuckets) * 100}%`, backgroundColor: objectiveBucketMeta.completedObjectives.color }} />
            <div style={{ width: `${(item.objectivesAbove50 / totalBuckets) * 100}%`, backgroundColor: objectiveBucketMeta.objectivesAbove50.color }} />
            <div style={{ width: `${(item.objectivesBetween0And50 / totalBuckets) * 100}%`, backgroundColor: objectiveBucketMeta.objectivesBetween0And50.color }} />
            <div style={{ width: `${(item.objectivesAtZero / totalBuckets) * 100}%`, backgroundColor: objectiveBucketMeta.objectivesAtZero.color }} />
          </>
        ) : (
          <div style={{ width: "100%", backgroundColor: "#E5E7EB" }} />
        )}
      </div>
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
