import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  consistencyApi,
  type ConsistencyModule,
  type ConsistencyResponse,
  type ConsistencySeverity,
} from "../services/consistencyApi";
import { loadConsistencyCheck } from "../services/screenDataCache";
import { resolveConsistencyActionTarget } from "../utils/consistencyAction";
import {
  COLORS,
  DEFAULT_STALE_DAYS,
  buildModuleStats,
  shortMotionTransition,
} from "./consistencia/consistencyShared";
import { FilterPanel } from "./consistencia/ConsistencyFilterPanel";
import {
  ConsistencyHero,
  EmptyState,
  IssueCard,
  LoadingState,
  MetricCard,
  ModulePanel,
} from "./consistencia/ConsistencyIssueViews";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar la consistencia estrategica.";
}

export function Consistencia() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<ConsistencySeverity | "todas">("todas");
  const [moduleFilter, setModuleFilter] = useState<ConsistencyModule | "todos">("todos");
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [data, setData] = useState<ConsistencyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const apiFilters = useMemo(() => ({
    staleDays: DEFAULT_STALE_DAYS,
    severity: severity === "todas" ? undefined : severity,
    module: moduleFilter === "todos" ? undefined : moduleFilter,
  }), [moduleFilter, severity]);

  const loadConsistency = useCallback(async (options?: { force?: boolean }) => {
    setLoading(true);
    setError("");
    try {
      setData(await loadConsistencyCheck(apiFilters, { force: options?.force }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apiFilters]);

  useEffect(() => {
    void loadConsistency();
  }, [loadConsistency]);

  const issues = data?.findings ?? [];
  const filtered = useMemo(() => issues
    .filter((issue) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [
        issue.severity,
        issue.module,
        issue.entityCode,
        issue.entityName,
        issue.description,
        issue.recommendedAction,
        issue.actionLabel,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(q),
      );
    }), [issues, search]);

  const selectedIssue = filtered.find((issue) => issue.id === selectedIssueId) ?? filtered[0] ?? null;
  const stats = data?.summary ?? { total: 0, high: 0, medium: 0, low: 0 };
  const moduleStats = useMemo(() => buildModuleStats(issues), [issues]);
  const healthScore = stats.total === 0 ? 100 : Math.max(0, Math.round(100 - ((stats.high * 18) + (stats.medium * 8) + (stats.low * 3))));
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: shortMotionTransition,
  };

  const goToIssue = (targetPath: string) => {
    const target = resolveConsistencyActionTarget(targetPath);
    if (!target) {
      setError("No se pudo abrir la accion correctiva porque su destino no es valido.");
      return;
    }
    navigate(target);
  };

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await consistencyApi.exportCsv(apiFilters);
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = "consistencia-estrategica.csv";
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSeverity("todas");
    setModuleFilter("todos");
    setSelectedIssueId("");
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl p-6">
        <ConsistencyHero
          healthScore={healthScore}
        />

        {error && (
          <motion.div {...viewMotion} className="mt-3 flex items-center gap-2 rounded-md px-4 py-3" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 850 }}>
            <AlertTriangle size={15} />
            {error}
          </motion.div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total hallazgos" value={stats.total} sub={`${filtered.length} visibles con busqueda`} icon={<ShieldAlert size={16} />} color={COLORS.blue} />
          <MetricCard label="Alta severidad" value={stats.high} sub="Requieren accion inmediata" icon={<AlertTriangle size={16} />} color={COLORS.orange} />
          <MetricCard label="Media severidad" value={stats.medium} sub="Riesgos de seguimiento" icon={<ShieldAlert size={16} />} color={COLORS.orange} />
          <MetricCard label="Baja severidad" value={stats.low} sub="Ajustes de cobertura" icon={<ShieldCheck size={16} />} color={COLORS.blue} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0 space-y-4">
            <FilterPanel
              moduleFilter={moduleFilter}
              onModuleChange={setModuleFilter}
              onExport={() => void exportCsv()}
              onReset={resetFilters}
              onSearchChange={setSearch}
              onSeverityChange={(value) => setSeverity(value as ConsistencySeverity | "todas")}
              exporting={exporting}
              loading={loading}
              search={search}
              severity={severity}
            />

            <AnimatePresence mode="wait" initial={false}>
              {loading && !data ? (
                <motion.div key="loading" {...viewMotion}>
                  <LoadingState />
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div key="empty" {...viewMotion}>
                  <EmptyState />
                </motion.div>
              ) : (
                <motion.div key="issues" {...viewMotion} className="space-y-3">
                  {filtered.map((issue, index) => (
                    <IssueCard
                      key={issue.id}
                      index={index}
                      issue={issue}
                      onOpen={() => goToIssue(issue.actionUrl)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <ModulePanel modules={moduleStats} />
          </aside>
        </div>
      </div>
    </div>
  );
}
