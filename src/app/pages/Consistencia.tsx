import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CounterStrip } from "../components/CounterStrip";
import {
  consistencyApi,
  type ConsistencyModule,
  type ConsistencyResponse,
  type ConsistencySeverity,
} from "../services/consistencyApi";
import { loadConsistencyCheck } from "../services/screenDataCache";
import { resolveConsistencyActionTarget } from "../utils/consistencyAction";
import {
  DEFAULT_STALE_DAYS,
  buildModuleStats,
  getModuleLabel,
  shortMotionTransition,
} from "./consistencia/consistencyShared";
import { FilterPanel } from "./consistencia/ConsistencyFilterPanel";
import { EmptyState, IssueTable, LoadingState } from "./consistencia/ConsistencyIssueViews";

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

  const moduleStats = useMemo(() => buildModuleStats(issues), [issues]);
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
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
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

      <div className="space-y-4 px-6 py-5">
        {error && (
          <motion.div {...viewMotion} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </motion.div>
        )}

        {data && (
          <CounterStrip
            items={[
              { label: "Hallazgos", value: data.summary.total },
              { label: "Severidad alta", value: data.summary.high },
              { label: "Severidad media", value: data.summary.medium },
              { label: "Severidad baja", value: data.summary.low },
              ...moduleStats.map((item) => ({ label: getModuleLabel(item.module), value: item.count })),
            ]}
          />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {loading && !data ? (
            <motion.div key="loading" {...viewMotion}>
              <LoadingState />
            </motion.div>
          ) : !data ? null : filtered.length === 0 ? (
            <motion.div key="empty" {...viewMotion}>
              <EmptyState />
            </motion.div>
          ) : (
            <motion.div key="issues" {...viewMotion}>
              <IssueTable issues={filtered} onOpen={(issue) => goToIssue(issue.actionUrl)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
