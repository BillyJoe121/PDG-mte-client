import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Loader2, RefreshCw, Target } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAudit } from "../context/AuditContext";
import { useGlobalFilters } from "../context/FiltersContext";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { Department } from "../services/strategicApi";
import { loadReportComparison, loadReportsScreen } from "../services/screenDataCache";
import type { ConsolidatedReport, PeriodComparison } from "../services/reportsApi";
import { buildExportFilename, downloadCSV, printPDF } from "../utils/exportUtils";
import {
  COLORS,
  activeLabel,
  buildCsvRows,
  formatPercent,
  getErrorMessage,
  reportTitleForTab,
  validatePeriod,
  type ReportTab,
} from "./reportes/reportUtils";
import {
  ComparisonCard,
  ConsolidatedDeepDive,
  DeltaBadge,
  DepartmentTable,
  EmptyState,
  ExportButton,
  GeneralSummary,
  RankingTable,
  ReportPanel,
  ReportSelect,
} from "./reportes/ReportSections";

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;
const viewMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: shortMotionTransition,
} as const;

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
        entidad: "Reporte de impacto estrategico",
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
      <div className="sgp-screen-only sticky top-0 z-40 bg-white px-6 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <ReportSelect
              value={period}
              onChange={handlePeriodChange}
              allLabel="Periodo activo"
              options={sortedPeriods.map((item) => ({ value: item.name, label: item.name }))}
            />
            <ReportSelect
              value={departmentId}
              onChange={setDepartmentId}
              allLabel="Todos: Departamento"
              options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              width={200}
            />
            <button onClick={clearFilters} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 11px", fontSize: 12, fontWeight: 750, backgroundColor: "#fff", color: "#374151", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
              Limpiar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void loadReport({ force: true })}
              disabled={loading}
              className="flex items-center justify-center rounded-md disabled:opacity-50"
              style={{ width: 38, height: 38, border: "1px solid #E5E7EB", backgroundColor: "#fff" }}
              title="Recargar reporte"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            </button>
            <ExportButton format="pdf" active={exporting === "pdf"} disabled={!!exporting} onClick={() => void exportWithFilters("pdf")} />
            <ExportButton format="csv" active={exporting === "csv"} disabled={!!exporting} onClick={() => void exportWithFilters("csv")} />
          </div>
        </div>

        <div className="mt-3 flex w-fit overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(17,24,39,0.05)]" style={{ border: `1.5px solid ${COLORS.border}` }}>
          {[
            { key: "general", label: "Consolidado" },
            { key: "departments", label: "Departamentos" },
            { key: "ranking", label: "Ranking" },
            { key: "comparison", label: "Comparativa" },
          ].map((item, index, arr) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as ReportTab)}
              style={{
                padding: "9px 15px",
                backgroundColor: tab === item.key ? "#EEF2FF" : "#fff",
                color: tab === item.key ? COLORS.blue : "#374151",
                borderRight: index === arr.length - 1 ? "none" : `1.5px solid ${COLORS.border}`,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="sgp-screen-only mb-5 hidden flex-wrap items-center gap-3 rounded-md bg-white px-4 py-3" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
          <ReportSelect
            value={period}
            onChange={handlePeriodChange}
            allLabel="Periodo activo"
            options={sortedPeriods.map((item) => ({ value: item.name, label: item.name }))}
          />
          <ReportSelect
            value={departmentId}
            onChange={setDepartmentId}
            allLabel="Todos: Departamento"
            options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
            width={210}
          />
          <button onClick={clearFilters} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 11px", fontSize: 12, fontWeight: 750, backgroundColor: "#fff", color: "#374151", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
            Limpiar
          </button>
        </div>

        {error && (
          <motion.div {...viewMotion} className="mb-5 flex items-center gap-2 rounded-md px-4 py-3" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 800 }}>
            <AlertTriangle size={15} /> {error}
          </motion.div>
        )}

        {loading && !report ? (
          <motion.div {...viewMotion} className="flex items-center justify-center rounded-md bg-white py-20" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando reportes...
          </motion.div>
        ) : report ? (
          <motion.div {...viewMotion} className="report-print-area">
            <div className="sgp-print-title hidden">
              <small>MTE - Modulo de Trazabilidad Estrategica</small>
              <h1>{isPrintingPdf ? "Reporte Consolidado Completo" : reportTitleForTab(tab)}</h1>
              <p>{reportSubtitle}</p>
            </div>
            {(tab === "general" || isPrintingPdf) && (
              <div className="space-y-5">
                {isPrintingPdf && (
                  <h2 className="hidden print:block" style={{ fontSize: 16, fontWeight: 900, color: COLORS.blue, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 8, marginTop: 10 }}>Consolidado estrategico</h2>
                )}
                <GeneralSummary report={report.general} />
                <ConsolidatedDeepDive report={report} />
                {!isPrintingPdf && (
                  <ReportPanel title="Resumen por departamento" subtitle="Insumo tabular para exportacion y revision institucional." icon={<Building2 size={16} />}>
                    <DepartmentTable data={report.departments} />
                  </ReportPanel>
                )}
              </div>
            )}

            {(tab === "departments" || isPrintingPdf) && (
              <div className={isPrintingPdf ? "mt-8" : ""}>
                {isPrintingPdf && (
                  <h2 className="hidden print:block mb-4" style={{ fontSize: 16, fontWeight: 900, color: COLORS.blue, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 8, pageBreakBefore: "always" }}>Desempeño por departamentos</h2>
                )}
                <ReportPanel title="Reporte por departamento" subtitle="Detalle operativo para descarga y trazabilidad por unidad." icon={<Building2 size={16} />}>
                  <DepartmentTable data={report.departments} />
                </ReportPanel>
              </div>
            )}

            {(tab === "ranking" || isPrintingPdf) && (
              <div className={isPrintingPdf ? "mt-8" : ""}>
                {isPrintingPdf && (
                  <h2 className="hidden print:block mb-4" style={{ fontSize: 16, fontWeight: 900, color: COLORS.blue, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 8, pageBreakBefore: "always" }}>Ranking de KRs</h2>
                )}
                <ReportPanel title="Ranking de KRs por cobertura" subtitle="Prioriza KRs para seguimiento, mejora y documentacion." icon={<Target size={16} />}>
                  <RankingTable data={report.keyResultRanking} />
                </ReportPanel>
              </div>
            )}

            {(tab === "comparison" || isPrintingPdf) && (
              <div className={`space-y-5 ${isPrintingPdf ? "mt-8" : ""}`}>
                {isPrintingPdf && (
                  <h2 className="hidden print:block mb-4" style={{ fontSize: 16, fontWeight: 900, color: COLORS.blue, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 8, pageBreakBefore: "always" }}>Comparativa de periodos</h2>
                )}
                <div className="sgp-screen-only rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 850, color: COLORS.gray, marginBottom: 6, textTransform: "uppercase" }}>Periodo base</label>
                      <ReportSelect value={basePeriod} onChange={setBasePeriod} options={sortedPeriods.map((item) => ({ value: item.name, label: item.name }))} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 850, color: COLORS.gray, marginBottom: 6, textTransform: "uppercase" }}>Periodo comparado</label>
                      <ReportSelect value={comparePeriod} onChange={setComparePeriod} options={sortedPeriods.map((item) => ({ value: item.name, label: item.name }))} />
                    </div>
                    <button onClick={() => void loadComparison({ force: true })} disabled={comparisonLoading || !basePeriod || !comparePeriod} className="flex items-center gap-2 rounded-md disabled:opacity-50" style={{ padding: "9px 13px", backgroundColor: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.blue}33` }}>
                      {comparisonLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Comparar
                    </button>
                  </div>
                </div>

                {comparisonLoading ? (
                  <div className="flex items-center justify-center rounded-md bg-white py-14" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
                    <Loader2 size={18} className="mr-2 animate-spin" /> Calculando comparativa...
                  </div>
                ) : comparison ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <ComparisonCard title={`Base: ${comparison.basePeriod}`} report={comparison.base} color={COLORS.blue} />
                      <ComparisonCard title={`Comparado: ${comparison.comparePeriod}`} report={comparison.compare} color={COLORS.green} />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <DeltaBadge
                        metric="Cobertura de KRs"
                        value={comparison.keyResultCoverageDelta}
                        basePeriod={comparison.basePeriod}
                        comparePeriod={comparison.comparePeriod}
                        baseValue={formatPercent(comparison.base.averageKeyResultCoverage)}
                        compareValue={formatPercent(comparison.compare.averageKeyResultCoverage)}
                      />
                    </div>
                  </>
                ) : (
                  <EmptyState text="Selecciona dos periodos para generar la comparativa." />
                )}
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
