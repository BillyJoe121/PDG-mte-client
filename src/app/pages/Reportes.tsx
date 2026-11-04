import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DETAIL_BUTTON_CLASS, DETAIL_PRIMARY_BUTTON_CLASS } from "../components/DetailModal";
import { PageTabs, TabButton } from "../components/PageToolbar";
import { useAudit } from "../context/AuditContext";
import { useGlobalFilters } from "../context/FiltersContext";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { Department } from "../services/strategicApi";
import { loadReportComparison, loadReportsScreen } from "../services/screenDataCache";
import type { ConsolidatedReport, PeriodComparison } from "../services/reportsApi";
import { buildExportFilename, downloadCSV, printPDF } from "../utils/exportUtils";
import {
  activeLabel,
  buildCsvRows,
  getErrorMessage,
  reportTitleForTab,
  validatePeriod,
  type ReportTab,
} from "./reportes/reportUtils";
import {
  ComparisonTable,
  DepartmentTable,
  EmptyState,
  ExportButton,
  GeneralSummary,
  PeriodField,
  PrintHeading,
  RankingTable,
  ReportSelect,
  TopKeyResults,
} from "./reportes/ReportSections";

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;
const viewMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: shortMotionTransition,
} as const;

const REPORT_TABS: Array<{ key: ReportTab; label: string }> = [
  { key: "general", label: "Consolidado" },
  { key: "departments", label: "Departamentos" },
  { key: "ranking", label: "Avance de KRs" },
  { key: "comparison", label: "Comparativa" },
];

export function Reportes() {
  const { filters, setFilter } = useGlobalFilters();
  const { logAudit } = useAudit();
  const [tab, setTab] = useState<ReportTab>("general");
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [period, setPeriod] = useState(filters.periodo === "todos" ? "" : filters.periodo);
  const [departmentId, setDepartmentId] = useState("");
  const [basePeriod, setBasePeriod] = useState("");
  const [comparePeriod, setComparePeriod] = useState("");
  const [report, setReport] = useState<ConsolidatedReport | null>(null);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const [error, setError] = useState("");

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );

  const periodOptions = useMemo(
    () => sortedPeriods.map((item) => ({ value: item.name, label: item.name })),
    [sortedPeriods],
  );

  const params = useMemo(() => ({
    period: period || undefined,
    departmentId: departmentId ? Number(departmentId) : undefined,
  }), [departmentId, period]);

  const selectedDepartment = useMemo(
    () => departments.find((department) => String(department.id) === departmentId)?.name ?? "",
    [departmentId, departments],
  );
  const reportSubtitle = useMemo(
    () => `Corte ${activeLabel(period, "activo")} - ${activeLabel(selectedDepartment, "todos los departamentos")}`,
    [period, selectedDepartment],
  );

  const loadReport = useCallback(async (options?: { force?: boolean }) => {
    if (!validatePeriod(period)) {
      setError("El periodo debe tener formato YYYY-Q1..Q4 o YYYY-1..2.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await loadReportsScreen(params, { force: options?.force });
      setPeriods(data.periods);
      setDepartments(data.departments);
      setReport(data.report);

      const ordered = [...data.periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
      setBasePeriod((current) => current || ordered[1]?.name || ordered[0]?.name || "");
      setComparePeriod((current) => current || ordered[0]?.name || "");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [params, period]);

  const loadComparison = useCallback(async (options?: { force?: boolean }) => {
    if (!basePeriod || !comparePeriod) return;
    if (!validatePeriod(basePeriod) || !validatePeriod(comparePeriod)) {
      setError("Los periodos de comparativa deben tener formato YYYY-Q1..Q4 o YYYY-1..2.");
      return;
    }

    setComparisonLoading(true);
    setError("");
    try {
      const data = await loadReportComparison({
        basePeriod,
        comparePeriod,
        departmentId: params.departmentId,
      }, { force: options?.force });
      setComparison(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setComparisonLoading(false);
    }
  }, [basePeriod, comparePeriod, params.departmentId]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    loadReport()
      .catch((err) => {
        if (mounted) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [loadReport]);

  useEffect(() => {
    if (tab === "comparison") void loadComparison();
  }, [loadComparison, tab]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setFilter("periodo", value || "todos");
  };

  const clearFilters = () => {
    setPeriod("");
    setDepartmentId("");
    setFilter("periodo", "todos");
  };

  const exportWithFilters = async (format: "csv" | "pdf") => {
    if (!report) {
      toast.error("No hay datos cargados para exportar.");
      return;
    }

    setExporting(format);
    try {
      if (format === "pdf") {
        if (!comparison && basePeriod && comparePeriod) {
          await loadComparison();
        }
        setIsPrintingPdf(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        printPDF("Reporte Estrategico Completo", {
          printableSelector: ".report-print-area",
          subtitle: reportSubtitle,
        });
        setIsPrintingPdf(false);
      } else {
        const rows = buildCsvRows(report, tab, comparison);
        if (!rows.length) throw new Error("No hay filas disponibles para CSV.");
        downloadCSV(rows, buildExportFilename("reporte", reportTitleForTab(tab)));
      }
      toast.success(`Reporte ${format.toUpperCase()} generado`);
      logAudit({
        modulo: "Reportes",
        accion: `Exportacion ${format.toUpperCase()}`,
        entidad: "Reporte estratégico",
        detalle: `Exportacion con periodo ${period || "activo"} y departamento ${departmentId || "todos"}.`,
        resultado: "info",
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="sgp-screen-only sticky top-0 z-40 border-b border-gray-200 bg-white px-6 pb-4 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <PageTabs label="Secciones del reporte">
              {REPORT_TABS.map((item) => (
                <TabButton key={item.key} active={tab === item.key} onClick={() => setTab(item.key)} label={item.label} />
              ))}
            </PageTabs>
            <ReportSelect
              label="Filtrar por periodo"
              value={period}
              onChange={handlePeriodChange}
              allLabel="Periodo activo"
              options={periodOptions}
            />
            <ReportSelect
              label="Filtrar por departamento"
              value={departmentId}
              onChange={setDepartmentId}
              allLabel="Todos: Departamento"
              options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              widthClassName="w-[170px]"
            />
            <button type="button" onClick={clearFilters} className={DETAIL_BUTTON_CLASS}>Limpiar</button>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void loadReport({ force: true })}
              disabled={loading}
              className={`${DETAIL_BUTTON_CLASS} w-[38px]`}
              title="Recargar reporte"
              aria-label="Recargar reporte"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
            <ExportButton format="pdf" active={exporting === "pdf"} disabled={!!exporting} onClick={() => void exportWithFilters("pdf")} />
            <ExportButton format="csv" active={exporting === "csv"} disabled={!!exporting} onClick={() => void exportWithFilters("csv")} />
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        {error && (
          <motion.div {...viewMotion} role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </motion.div>
        )}

        {loading && !report ? (
          <motion.div {...viewMotion} role="status" className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <Loader2 className="animate-spin text-[#5454E9]" size={24} />
            <span className="ml-3 text-sm font-semibold text-gray-600">Cargando reportes…</span>
          </motion.div>
        ) : report ? (
          <motion.div {...viewMotion} className="report-print-area">
            <div className="sgp-print-title hidden">
              <small>MTE - Modulo de Trazabilidad Estrategica</small>
              <h1>{isPrintingPdf ? "Reporte Consolidado Completo" : reportTitleForTab(tab)}</h1>
              <p>{reportSubtitle}</p>
            </div>
            {(tab === "general" || isPrintingPdf) && (
              <div className="space-y-4">
                {isPrintingPdf && <PrintHeading>Consolidado estratégico</PrintHeading>}
                <GeneralSummary report={report.general} />
                <TopKeyResults data={report.keyResultRanking} />
              </div>
            )}

            {(tab === "departments" || isPrintingPdf) && (
              <div className={isPrintingPdf ? "mt-8" : ""}>
                {isPrintingPdf && <PrintHeading newPage>Desempeño por departamentos</PrintHeading>}
                <DepartmentTable data={report.departments} />
              </div>
            )}

            {(tab === "ranking" || isPrintingPdf) && (
              <div className={isPrintingPdf ? "mt-8" : ""}>
                {isPrintingPdf && <PrintHeading newPage>KRs por avance registrado</PrintHeading>}
                <RankingTable data={report.keyResultRanking} />
              </div>
            )}

            {(tab === "comparison" || isPrintingPdf) && (
              <div className={`space-y-4 ${isPrintingPdf ? "mt-8" : ""}`}>
                {isPrintingPdf && <PrintHeading newPage>Comparativa de periodos</PrintHeading>}
                <div className="sgp-screen-only flex flex-wrap items-end gap-2">
                  <PeriodField label="Periodo base" value={basePeriod} onChange={setBasePeriod} options={periodOptions} />
                  <PeriodField label="Periodo comparado" value={comparePeriod} onChange={setComparePeriod} options={periodOptions} />
                  <button type="button" onClick={() => void loadComparison({ force: true })} disabled={comparisonLoading || !basePeriod || !comparePeriod} className={DETAIL_PRIMARY_BUTTON_CLASS}>
                    {comparisonLoading && <Loader2 size={14} className="animate-spin" />} Comparar
                  </button>
                </div>

                {comparisonLoading ? (
                  <div role="status" className="flex min-h-40 items-center justify-center rounded-lg border border-gray-200 bg-white">
                    <Loader2 className="animate-spin text-[#5454E9]" size={24} />
                    <span className="ml-3 text-sm font-semibold text-gray-600">Cargando comparativa…</span>
                  </div>
                ) : comparison ? (
                  <ComparisonTable comparison={comparison} />
                ) : (
                  <EmptyState text="Aún no hay comparativa. Elige los dos periodos y pulsa Comparar." />
                )}
              </div>
            )}
          </motion.div>
        ) : !error ? (
          <EmptyState text="No hay reporte consolidado para los filtros seleccionados. Cambia el periodo o el departamento." />
        ) : null}
      </div>
    </div>
  );
}
