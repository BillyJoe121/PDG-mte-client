import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { CounterStrip } from "../components/CounterStrip";
import { useGlobalFilters } from "../context/FiltersContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { DashboardData } from "../services/dashboardApi";
import type { KeyResultStatus } from "../services/strategicApi";
import { loadDashboardScreen } from "../services/screenDataCache";
import { CoverageSection, DashboardEmptyState as EmptyState, type CoverageItem, type CoverageScope } from "./dashboard/DashboardCoverage";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { buildKeyResultsDrilldownUrl } from "./okrs/keyResultListModel";
import { DashboardPanel, KeyResultsByStatus, ProjectStatusDistribution, buildKpis, sumCounts } from "./dashboard/DashboardPanels";
import { viewMotion } from "./dashboard/dashboardTheme";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar el dashboard.";
}

export function Dashboard() {
  const navigate = useNavigate();
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

  const openKeyResultsByStatus = useCallback((scope: CoverageScope, item: CoverageItem, status: KeyResultStatus) => {
    // Los KR no tienen departamento propio: ese alcance solo lleva estado y periodo.
    navigate(buildKeyResultsDrilldownUrl({
      scope,
      name: item.name,
      status,
      period: selectedPeriod || dashboard?.summary.period || undefined,
    }));
  }, [navigate, selectedPeriod, dashboard?.summary.period]);

  const kpis = useMemo(
    () => (dashboard ? buildKpis(dashboard.summary, sumCounts(dashboard.projectsByStatus)) : null),
    [dashboard],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardHeader
        activePeriodName={activePeriodName}
        loading={loading}
        onPeriodChange={handlePeriodChange}
        onReload={() => void loadDashboard(selectedPeriod || undefined, { force: true })}
        periods={sortedPeriods}
        selectedPeriod={selectedPeriod}
      />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <motion.div {...viewMotion} role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
            <AlertTriangle size={15} aria-hidden="true" /> {error}
          </motion.div>
        )}

        {loading && !dashboard ? (
          <motion.div {...viewMotion} className="flex items-center justify-center rounded-lg border border-gray-200 bg-white py-20 text-xs font-bold text-gray-500">
            <Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" /> Cargando dashboard...
          </motion.div>
        ) : dashboard && kpis ? (
          <motion.main {...viewMotion} className="space-y-4">
            <CounterStrip items={kpis} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DashboardPanel title="Iniciativas por estado">
                <ProjectStatusDistribution data={dashboard.projectsByStatus} />
              </DashboardPanel>
              <DashboardPanel title="KRs por estado">
                <KeyResultsByStatus data={dashboard.keyResultsByStatus} />
              </DashboardPanel>
            </div>

            <CoverageSection data={dashboard} onStatusClick={openKeyResultsByStatus} />
          </motion.main>
        ) : (
          <EmptyState text="Sin datos para el periodo seleccionado." />
        )}
      </div>
    </div>
  );
}
