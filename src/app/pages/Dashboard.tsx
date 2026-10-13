import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FolderKanban,
  Layers3,
  Loader2,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { DashboardData } from "../services/dashboardApi";
import { loadDashboardScreen } from "../services/screenDataCache";
import {
  DashboardEmptyState as EmptyState,
  DepartmentPerformance,
  GoalCoverage,
  StrategicBetCoverage,
  keyResultBucketToProgressFilter,
  type CoverageItem,
  type CoverageScope,
  type KeyResultBucketKey,
} from "./dashboard/DashboardCoverage";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import {
  DashboardKpiGrid,
  DashboardPanel,
  KeyResultsProgress,
  ProjectStatusDistribution,
  buildKpis,
  sumCounts,
  type DashboardKpi,
} from "./dashboard/DashboardPanels";
import { COLORS, viewMotion } from "./dashboard/dashboardTheme";

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

type DashboardDerived = {
  kpis: DashboardKpi[];
};

export function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { filters, setFilter } = useGlobalFilters();
  const initialPeriod = filters.periodo === "todos" ? "" : filters.periodo;
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
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
      setPeriods(data.periods);
      setDashboard(data.dashboard);
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

  const openKeyResultsFromBucket = useCallback((scope: CoverageScope, item: CoverageItem, bucket: KeyResultBucketKey) => {
    const params = new URLSearchParams();
    params.set("progress", keyResultBucketToProgressFilter[bucket]);
    // La pantalla de KRs busca por nombre de Meta o Apuesta; los KRs no tienen departamento propio.
    if (scope !== "department") params.set("q", item.name);
    navigate(`/krs?${params.toString()}`);
  }, [navigate]);

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
                  title="Iniciativas por estado"
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
                subtitle="KRs de las iniciativas de cada departamento segun sus rangos de avance."
                icon={<Layers3 size={16} />}
              >
                <DepartmentPerformance
                  data={dashboard.departments}
                  onBucketClick={(item, bucket) => openKeyResultsFromBucket("department", item, bucket)}
                />
              </DashboardPanel>

              <DashboardPanel
                title="Cobertura por apuesta estrategica"
                subtitle="Alineacion de KRs e iniciativas alrededor de cada apuesta."
                icon={<BarChart3 size={16} />}
              >
                <StrategicBetCoverage
                  data={dashboard.strategicBets}
                  onBucketClick={(item, bucket) => openKeyResultsFromBucket("strategicBet", item, bucket)}
                />
              </DashboardPanel>

              <DashboardPanel
                title="Cobertura por meta"
                subtitle="KRs agrupados por meta institucional segun sus buckets de avance."
                icon={<Target size={16} />}
              >
                <GoalCoverage
                  data={dashboard.goals}
                  onBucketClick={(item, bucket) => openKeyResultsFromBucket("goal", item, bucket)}
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
